from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import UserClaims, require_role
from databases.session import get_db
from databases.schema.models import (
    Doctor,
    Manufacturer,
    Product,
    ResearchSubmission,
    AdrReport,
    Feedback,
    Referral,
)

router = APIRouter(tags=["dashboards"])


class AdminDashboardSummary(BaseModel):
    registered_doctors: int = Field(ge=0)
    verified_doctors: int = Field(ge=0)
    registered_manufacturers: int = Field(ge=0)
    verified_manufacturers: int = Field(ge=0)
    approved_products: int = Field(ge=0)
    pending_products: int = Field(default=0, ge=0)
    total_products: int = Field(default=0, ge=0)
    total_research_submissions: int = Field(default=0, ge=0)
    approved_research_submissions: int = Field(default=0, ge=0)
    total_adr_reports: int = Field(default=0, ge=0)
    total_feedback: int = Field(default=0, ge=0)
    total_referrals: int = Field(default=0, ge=0)


class TerritoryCounts(BaseModel):
    territory: str
    doctor_count: int = Field(ge=0)
    manufacturer_count: int = Field(ge=0)


class TerritorySummary(BaseModel):
    items: list[TerritoryCounts]
    total: int = Field(ge=0)


class ManufacturerDashboardSummary(BaseModel):
    approved_products: int = Field(ge=0)
    pending_products: int = Field(ge=0)
    rejected_products: int = Field(ge=0)
    doctor_feedback_count: int = Field(ge=0)


class FeedbackCategorySummary(BaseModel):
    category: str
    count: int = Field(ge=0)


class ManufacturerFeedbackSummary(BaseModel):
    total_feedback: int = Field(ge=0)
    categories: list[FeedbackCategorySummary]


class ManufacturerTerritoryCounts(BaseModel):
    territory: str
    doctor_count: int = Field(ge=0)


class ManufacturerTerritorySummary(BaseModel):
    items: list[ManufacturerTerritoryCounts]
    total: int = Field(ge=0)


@router.get("/api/v1/admin/dashboard/summary", response_model=AdminDashboardSummary)
async def get_admin_dashboard_summary(
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> AdminDashboardSummary:
    registered_doctors = db.query(Doctor).count()
    verified_doctors = db.query(Doctor).filter(Doctor.verification_status == "approved").count()

    registered_manufacturers = db.query(Manufacturer).count()
    verified_manufacturers = db.query(Manufacturer).filter(Manufacturer.verification_status == "approved").count()

    approved_products = db.query(Product).filter(Product.approval_status == "approved").count()
    pending_products = db.query(Product).filter(Product.approval_status == "pending").count()
    total_products = db.query(Product).count()

    total_research = db.query(ResearchSubmission).count()
    approved_research = db.query(ResearchSubmission).filter(ResearchSubmission.status == "approved").count()

    total_adr = db.query(AdrReport).count()
    total_feedback = db.query(Feedback).count()
    total_referrals = db.query(Referral).count()

    return AdminDashboardSummary(
        registered_doctors=registered_doctors,
        verified_doctors=verified_doctors,
        registered_manufacturers=registered_manufacturers,
        verified_manufacturers=verified_manufacturers,
        approved_products=approved_products,
        pending_products=pending_products,
        total_products=total_products,
        total_research_submissions=total_research,
        approved_research_submissions=approved_research,
        total_adr_reports=total_adr,
        total_feedback=total_feedback,
        total_referrals=total_referrals,
    )


@router.get("/api/v1/admin/territories/summary", response_model=TerritorySummary)
async def get_admin_territory_summary(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> TerritorySummary:
    # Since neither Doctor nor Manufacturer models currently have a territory field defined in the schema,
    # the existing persisted database contains 0 territory-tagged records.
    # Return valid empty paginated territory summary.
    items: list[TerritoryCounts] = []
    return TerritorySummary(
        items=items,
        total=0,
    )


@router.get(
    "/api/v1/manufacturers/me/dashboard",
    response_model=ManufacturerDashboardSummary,
)
async def get_manufacturer_dashboard(
    user: UserClaims = Depends(require_role("manufacturer")),
    db: Session = Depends(get_db),
) -> ManufacturerDashboardSummary:
    mfg = db.query(Manufacturer).filter(Manufacturer.user_id == user["sub"]).first()
    if not mfg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer profile not found",
        )

    approved = db.query(Product).filter(Product.manufacturer_id == mfg.id, Product.approval_status == "approved").count()
    pending = db.query(Product).filter(Product.manufacturer_id == mfg.id, Product.approval_status == "pending").count()
    rejected = db.query(Product).filter(Product.manufacturer_id == mfg.id, Product.approval_status == "rejected").count()

    # Product feedback count
    doctor_fb_count = (
        db.query(Feedback)
        .filter(Feedback.category == "product")
        .count()
    )

    return ManufacturerDashboardSummary(
        approved_products=approved,
        pending_products=pending,
        rejected_products=rejected,
        doctor_feedback_count=doctor_fb_count,
    )


@router.get(
    "/api/v1/manufacturers/me/doctor-feedback-summary",
    response_model=ManufacturerFeedbackSummary,
)
async def get_manufacturer_doctor_feedback_summary(
    user: UserClaims = Depends(require_role("manufacturer")),
    db: Session = Depends(get_db),
) -> ManufacturerFeedbackSummary:
    mfg = db.query(Manufacturer).filter(Manufacturer.user_id == user["sub"]).first()
    if not mfg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer profile not found",
        )

    # Categories breakdown
    categories = ["product", "service", "website", "other"]
    cat_summaries: list[FeedbackCategorySummary] = []
    total_feedback = 0

    for cat in categories:
        cnt = db.query(Feedback).filter(Feedback.category == cat).count()
        cat_summaries.append(FeedbackCategorySummary(category=cat, count=cnt))
        total_feedback += cnt

    return ManufacturerFeedbackSummary(
        total_feedback=total_feedback,
        categories=cat_summaries,
    )


@router.get(
    "/api/v1/manufacturers/me/territory-summary",
    response_model=ManufacturerTerritorySummary,
)
async def get_manufacturer_territory_summary(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("manufacturer")),
    db: Session = Depends(get_db),
) -> ManufacturerTerritorySummary:
    mfg = db.query(Manufacturer).filter(Manufacturer.user_id == user["sub"]).first()
    if not mfg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer profile not found",
        )

    # Since neither Doctor nor Manufacturer currently has territory columns in the schema,
    # return valid empty paginated territory summary
    items: list[ManufacturerTerritoryCounts] = []
    return ManufacturerTerritorySummary(
        items=items,
        total=0,
    )
