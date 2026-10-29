from datetime import date, datetime
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import UserClaims, require_role
from databases.session import get_db
from databases.schema.models import (
    Doctor,
    Manufacturer,
    Product,
    AdrReport as DBAdrReport,
    AuditHistory,
)

router = APIRouter(tags=["adverse drug reaction reports"])


# --- Schemas ---

class AdrReportSubmission(BaseModel):
    product_id: str = Field(min_length=1, max_length=100)
    product_name: str = Field(min_length=1, max_length=300)
    reaction: str = Field(min_length=1, max_length=2000)
    occurred_on: date
    outcome: Literal["recovered", "recovering", "not_recovered", "fatal", "unknown"]
    seriousness: Literal["non_serious", "serious", "life_threatening", "fatal"]
    description: str = Field(min_length=1, max_length=10000)


class AdrReport(AdrReportSubmission):
    id: str
    doctor_id: str
    status: Literal["submitted", "under_review", "closed"]
    submitted_at: datetime


class AdrReportList(BaseModel):
    items: list[AdrReport]
    total: int


def _build_adr_report(report: DBAdrReport) -> AdrReport:
    return AdrReport(
        id=report.id,
        doctor_id=report.doctor_id,
        product_id=report.product_id,
        product_name=report.product_name,
        reaction=report.reaction,
        occurred_on=report.occurred_on,
        outcome=report.outcome,
        seriousness=report.seriousness,
        description=report.description,
        status=report.status,
        submitted_at=report.submitted_at,
    )


# --- Endpoints ---

@router.post(
    "/api/v1/adr-reports",
    response_model=AdrReport,
    status_code=status.HTTP_201_CREATED,
)
async def submit_adr_report(
    payload: AdrReportSubmission,
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> AdrReport:
    # Resolve the authenticated doctor
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for authenticated user",
        )

    # Validate the product exists
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # Note: Submission of an ADR report does not constitute proof that the product caused the reaction.
    report = DBAdrReport(
        doctor_id=doctor.id,
        product_id=product.id,
        product_name=payload.product_name,
        reaction=payload.reaction,
        occurred_on=payload.occurred_on,
        outcome=payload.outcome,
        seriousness=payload.seriousness,
        description=payload.description,
        status="submitted",
    )
    db.add(report)
    db.flush()

    # Log action to audit history
    audit = AuditHistory(
        actor_id=user["sub"],
        action="submit_adr_report",
        target_entity="adr_report",
        target_id=report.id,
        details={
            "doctor_id": doctor.id,
            "product_id": product.id,
            "seriousness": payload.seriousness,
            "outcome": payload.outcome,
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(report)
    return _build_adr_report(report)


@router.get("/api/v1/doctors/me/adr-reports", response_model=AdrReportList)
async def list_own_adr_reports(
    report_status: Literal["submitted", "under_review", "closed"] | None = Query(
        default=None, alias="status"
    ),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> AdrReportList:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for authenticated user",
        )

    query = db.query(DBAdrReport).filter(DBAdrReport.doctor_id == doctor.id)
    if report_status:
        query = query.filter(DBAdrReport.status == report_status)

    total = query.count()
    items = query.order_by(DBAdrReport.submitted_at.desc()).offset(offset).limit(limit).all()

    return AdrReportList(
        items=[_build_adr_report(item) for item in items],
        total=total,
    )


@router.get("/api/v1/admin/adr-reports", response_model=AdrReportList)
async def list_adr_reports(
    report_status: Literal["submitted", "under_review", "closed"] | None = Query(
        default=None, alias="status"
    ),
    seriousness: Literal["non_serious", "serious", "life_threatening", "fatal"] | None = Query(
        default=None, alias="seriousness"
    ),
    product_id: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> AdrReportList:
    query = db.query(DBAdrReport)
    if report_status:
        query = query.filter(DBAdrReport.status == report_status)
    if seriousness:
        query = query.filter(DBAdrReport.seriousness == seriousness)
    if product_id:
        query = query.filter(DBAdrReport.product_id == product_id)

    total = query.count()
    items = query.order_by(DBAdrReport.submitted_at.desc()).offset(offset).limit(limit).all()

    return AdrReportList(
        items=[_build_adr_report(item) for item in items],
        total=total,
    )


@router.get(
    "/api/v1/manufacturers/me/adr-reports",
    response_model=AdrReportList,
)
async def list_adr_reports_for_manufacturer(
    product_id: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("manufacturer")),
    db: Session = Depends(get_db),
) -> AdrReportList:
    # Resolve the authenticated manufacturer
    manufacturer = db.query(Manufacturer).filter(Manufacturer.user_id == user["sub"]).first()
    if not manufacturer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer profile not found for authenticated user",
        )

    # Query only ADR reports for products belonging to this manufacturer
    query = db.query(DBAdrReport).join(Product, DBAdrReport.product_id == Product.id).filter(
        Product.manufacturer_id == manufacturer.id
    )

    if product_id:
        # If product_id is supplied, verify it belongs to this manufacturer
        query = query.filter(DBAdrReport.product_id == product_id)

    total = query.count()
    items = query.order_by(DBAdrReport.submitted_at.desc()).offset(offset).limit(limit).all()

    return AdrReportList(
        items=[_build_adr_report(item) for item in items],
        total=total,
    )
