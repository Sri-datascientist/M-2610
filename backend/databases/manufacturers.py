from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth import UserClaims, require_role, hash_password
from databases.session import get_db
from databases.schema.models import User, Manufacturer, AuditHistory

router = APIRouter(tags=["manufacturers"])


# --- Schemas ---

class ManufacturerRegistration(BaseModel):
    company_name: str = Field(min_length=1, max_length=200)
    contact_name: str = Field(min_length=1, max_length=200)
    contact_email: EmailStr


class ManufacturerProfileUpdate(BaseModel):
    contact_name: str | None = Field(default=None, min_length=1, max_length=200)
    contact_email: EmailStr | None = None


class ManufacturerProfile(BaseModel):
    id: str
    company_name: str
    contact_name: str
    contact_email: str
    verification_status: Literal["pending", "approved", "rejected"]


class ManufacturerList(BaseModel):
    items: list[ManufacturerProfile]
    total: int


class VerificationDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    notes: str | None = Field(default=None, max_length=2000)


def _build_manufacturer_profile(manufacturer: Manufacturer) -> ManufacturerProfile:
    return ManufacturerProfile(
        id=manufacturer.id,
        company_name=manufacturer.company_name,
        contact_name=manufacturer.contact_name,
        contact_email=manufacturer.contact_email,
        verification_status=manufacturer.verification_status,
    )


# --- Endpoints ---

@router.post(
    "/api/v1/manufacturers",
    response_model=ManufacturerProfile,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new manufacturer (standalone profile creation)",
)
def register_manufacturer(
    payload: ManufacturerRegistration,
    db: Session = Depends(get_db),
) -> ManufacturerProfile:
    contact_email_lower = payload.contact_email.lower()

    # 1. Prevent duplicate manufacturer accounts by contact email
    existing_user = db.query(User).filter(User.email == contact_email_lower).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # 2. Check if company name already registered
    existing_company = db.query(Manufacturer).filter(
        Manufacturer.company_name.ilike(payload.company_name)
    ).first()
    if existing_company is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A manufacturer with this company name already exists.",
        )

    # 3. Create linked User and Manufacturer entities
    new_user = User(
        email=contact_email_lower,
        hashed_password=hash_password("TempPassword123!"),  # Placeholder hash
        role="manufacturer",
        status="active",
    )
    db.add(new_user)
    db.flush()

    new_manufacturer = Manufacturer(
        user_id=new_user.id,
        company_name=payload.company_name,
        contact_name=payload.contact_name,
        contact_email=contact_email_lower,
        verification_status="pending",
    )
    db.add(new_manufacturer)

    # 4. Audit History
    audit = AuditHistory(
        actor_id=new_user.id,
        action="MANUFACTURER_PROFILE_CREATED",
        target_entity="Manufacturer",
        target_id=new_manufacturer.id,
        details={
            "company_name": new_manufacturer.company_name,
            "contact_email": new_manufacturer.contact_email,
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(new_manufacturer)
    return _build_manufacturer_profile(new_manufacturer)


@router.get(
    "/api/v1/manufacturers/me",
    response_model=ManufacturerProfile,
    summary="Get current manufacturer profile",
)
def get_current_manufacturer(
    user: UserClaims = Depends(require_role("manufacturer")),
    db: Session = Depends(get_db),
) -> ManufacturerProfile:
    manufacturer = db.query(Manufacturer).filter(Manufacturer.user_id == user["sub"]).first()
    if manufacturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer profile not found.",
        )
    return _build_manufacturer_profile(manufacturer)


@router.patch(
    "/api/v1/manufacturers/me",
    response_model=ManufacturerProfile,
    summary="Update current manufacturer profile",
)
def update_current_manufacturer(
    payload: ManufacturerProfileUpdate,
    user: UserClaims = Depends(require_role("manufacturer")),
    db: Session = Depends(get_db),
) -> ManufacturerProfile:
    manufacturer = db.query(Manufacturer).filter(Manufacturer.user_id == user["sub"]).first()
    if manufacturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer profile not found.",
        )

    if payload.contact_email is not None:
        new_email = payload.contact_email.lower()
        if new_email != manufacturer.contact_email:
            # Check for conflict in User table
            existing = db.query(User).filter(User.email == new_email).first()
            if existing is not None and existing.id != manufacturer.user_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email address already exists.",
                )
            manufacturer.contact_email = new_email
            if manufacturer.user:
                manufacturer.user.email = new_email

    if payload.contact_name is not None:
        manufacturer.contact_name = payload.contact_name

    # Audit history
    audit = AuditHistory(
        actor_id=user["sub"],
        action="MANUFACTURER_SELF_PROFILE_UPDATE",
        target_entity="Manufacturer",
        target_id=manufacturer.id,
        details={"updated_fields": list(payload.model_dump(exclude_unset=True).keys())},
    )
    db.add(audit)

    db.commit()
    db.refresh(manufacturer)
    return _build_manufacturer_profile(manufacturer)


@router.get(
    "/api/v1/admin/manufacturers",
    response_model=ManufacturerList,
    summary="Admin: List registered manufacturers with search and pagination",
)
def list_manufacturers(
    search: str | None = Query(default=None, description="Search manufacturer company name or contact email"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> ManufacturerList:
    query = db.query(Manufacturer)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Manufacturer.company_name.ilike(search_filter),
                Manufacturer.contact_email.ilike(search_filter),
                Manufacturer.contact_name.ilike(search_filter),
            )
        )

    total = query.count()
    manufacturers = query.offset(offset).limit(limit).all()

    return ManufacturerList(
        items=[_build_manufacturer_profile(m) for m in manufacturers],
        total=total,
    )


@router.get(
    "/api/v1/admin/manufacturers/{manufacturerId}",
    response_model=ManufacturerProfile,
    summary="Admin: Get manufacturer profile by ID",
)
def get_manufacturer(
    manufacturer_id: str = Path(alias="manufacturerId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> ManufacturerProfile:
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if manufacturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer not found.",
        )
    return _build_manufacturer_profile(manufacturer)


@router.patch(
    "/api/v1/admin/manufacturers/{manufacturerId}/verification",
    response_model=ManufacturerProfile,
    summary="Admin: Decide manufacturer verification status",
)
def decide_manufacturer_verification(
    payload: VerificationDecision,
    manufacturer_id: str = Path(alias="manufacturerId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> ManufacturerProfile:
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if manufacturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer not found.",
        )

    previous_status = manufacturer.verification_status
    manufacturer.verification_status = payload.decision
    if payload.notes:
        manufacturer.admin_notes = payload.notes

    # Audit history entry
    audit = AuditHistory(
        actor_id=user["sub"],
        action="MANUFACTURER_VERIFICATION_DECISION",
        target_entity="Manufacturer",
        target_id=manufacturer.id,
        details={
            "previous_status": previous_status,
            "new_status": payload.decision,
            "notes": payload.notes,
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(manufacturer)
    return _build_manufacturer_profile(manufacturer)
