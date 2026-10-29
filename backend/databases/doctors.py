from datetime import date, datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth import UserClaims, require_role, hash_password
from databases.session import get_db
from databases.schema.models import User, Doctor, DoctorCertification, AuditHistory

router = APIRouter(tags=["doctors"])


# --- Schemas ---

class DoctorRegistration(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    medical_license_number: str = Field(min_length=1, max_length=100)
    specialty: str = Field(min_length=1, max_length=200)


class DoctorProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    email: EmailStr | None = None
    specialty: str | None = Field(default=None, min_length=1, max_length=200)


class DoctorAdminUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    specialty: str | None = Field(default=None, min_length=1, max_length=200)
    admin_notes: str | None = Field(default=None, max_length=2000)


class CertificationSubmission(BaseModel):
    certification_name: str = Field(min_length=1, max_length=200)
    issuing_organization: str = Field(min_length=1, max_length=200)
    issue_date: date
    expiration_date: date | None = None
    evidence_reference: str = Field(min_length=1, max_length=2000)


class CertificationRecord(CertificationSubmission):
    id: str
    verification_status: Literal["pending", "approved", "rejected"]


class DoctorProfile(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    medical_license_number: str
    specialty: str
    qualification: str | None = None
    pincode: str | None = None
    phone: str | None = None
    invite_code: str | None = None
    referred_by_invite_code: str | None = None
    verification_status: Literal["pending", "approved", "rejected"]
    admin_notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DoctorVerificationStatus(BaseModel):
    status: Literal["pending", "approved", "rejected"]
    certifications: list[CertificationRecord]


class DoctorList(BaseModel):
    items: list[DoctorProfile]
    total: int


class VerificationDecision(BaseModel):
    decision: Literal["approved", "rejected", "pending"]
    notes: str | None = Field(default=None, max_length=2000)


def _build_doctor_profile(doctor: Doctor) -> DoctorProfile:
    email = doctor.user.email if doctor.user else ""
    return DoctorProfile(
        id=doctor.id,
        full_name=doctor.full_name,
        email=email,
        medical_license_number=doctor.medical_license_number,
        specialty=doctor.specialty,
        qualification=doctor.qualification or "BAMS",
        pincode=doctor.pincode,
        phone=doctor.phone,
        invite_code=doctor.invite_code,
        referred_by_invite_code=doctor.referred_by_invite_code,
        verification_status=doctor.verification_status,
        admin_notes=doctor.admin_notes,
        created_at=doctor.created_at,
        updated_at=doctor.updated_at,
    )


# --- Endpoints ---

@router.post(
    "/api/v1/doctors",
    response_model=DoctorProfile,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new doctor (standalone profile creation)",
)
def register_doctor(
    payload: DoctorRegistration,
    db: Session = Depends(get_db),
) -> DoctorProfile:
    # 1. Check for existing doctor with this medical license
    existing_license = db.query(Doctor).filter(
        Doctor.medical_license_number == payload.medical_license_number
    ).first()
    if existing_license is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A doctor with this medical license number already exists.",
        )

    # 2. Check for existing user account with this email
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # 3. Create linked user and doctor entities
    new_user = User(
        email=payload.email.lower(),
        hashed_password=hash_password("TempPassword123!"),  # Placeholder or initial temp password
        role="doctor",
        status="active",
    )
    db.add(new_user)
    db.flush()

    new_doctor = Doctor(
        user_id=new_user.id,
        full_name=payload.full_name,
        medical_license_number=payload.medical_license_number,
        specialty=payload.specialty,
        verification_status="pending",
    )
    db.add(new_doctor)

    # Audit history
    audit = AuditHistory(
        actor_id=new_user.id,
        action="DOCTOR_PROFILE_CREATED",
        target_entity="Doctor",
        target_id=new_doctor.id,
        details={"email": new_user.email, "license": new_doctor.medical_license_number},
    )
    db.add(audit)

    db.commit()
    db.refresh(new_doctor)
    return _build_doctor_profile(new_doctor)


@router.get(
    "/api/v1/doctors/me",
    response_model=DoctorProfile,
    summary="Get current doctor profile",
)
def get_current_doctor(
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> DoctorProfile:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found.",
        )
    return _build_doctor_profile(doctor)


@router.patch(
    "/api/v1/doctors/me",
    response_model=DoctorProfile,
    summary="Update current doctor profile",
)
def update_current_doctor(
    payload: DoctorProfileUpdate,
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> DoctorProfile:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found.",
        )

    # If updating email, check uniqueness
    if payload.email is not None and payload.email.lower() != doctor.user.email:
        existing = db.query(User).filter(User.email == payload.email.lower()).first()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )
        doctor.user.email = payload.email.lower()

    if payload.full_name is not None:
        doctor.full_name = payload.full_name
    if payload.specialty is not None:
        doctor.specialty = payload.specialty

    # Audit
    audit = AuditHistory(
        actor_id=user["sub"],
        action="DOCTOR_SELF_PROFILE_UPDATE",
        target_entity="Doctor",
        target_id=doctor.id,
        details={"updated_fields": list(payload.model_dump(exclude_unset=True).keys())},
    )
    db.add(audit)

    db.commit()
    db.refresh(doctor)
    return _build_doctor_profile(doctor)


@router.post(
    "/api/v1/doctors/me/certifications",
    response_model=CertificationRecord,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a professional certification",
)
def submit_certification(
    payload: CertificationSubmission,
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> CertificationRecord:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found.",
        )

    # Convert date to timezone-aware datetime for UTC storage
    issue_dt = datetime.combine(payload.issue_date, datetime.min.time(), tzinfo=timezone.utc)
    exp_dt = (
        datetime.combine(payload.expiration_date, datetime.min.time(), tzinfo=timezone.utc)
        if payload.expiration_date is not None
        else None
    )

    cert = DoctorCertification(
        doctor_id=doctor.id,
        certification_name=payload.certification_name,
        issuing_organization=payload.issuing_organization,
        issue_date=issue_dt,
        expiration_date=exp_dt,
        evidence_reference=payload.evidence_reference,
        verification_status="pending",
    )
    db.add(cert)

    audit = AuditHistory(
        actor_id=user["sub"],
        action="CERTIFICATION_SUBMITTED",
        target_entity="DoctorCertification",
        target_id=cert.id,
        details={"certification_name": cert.certification_name},
    )
    db.add(audit)

    db.commit()
    db.refresh(cert)

    return CertificationRecord(
        id=cert.id,
        certification_name=cert.certification_name,
        issuing_organization=cert.issuing_organization,
        issue_date=cert.issue_date.date(),
        expiration_date=cert.expiration_date.date() if cert.expiration_date else None,
        evidence_reference=cert.evidence_reference,
        verification_status=cert.verification_status,
    )


@router.get(
    "/api/v1/doctors/me/verification",
    response_model=DoctorVerificationStatus,
    summary="Get verification status and submitted certifications",
)
def get_own_verification_status(
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> DoctorVerificationStatus:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found.",
        )

    certs_records = [
        CertificationRecord(
            id=c.id,
            certification_name=c.certification_name,
            issuing_organization=c.issuing_organization,
            issue_date=c.issue_date.date(),
            expiration_date=c.expiration_date.date() if c.expiration_date else None,
            evidence_reference=c.evidence_reference,
            verification_status=c.verification_status,
        )
        for c in doctor.certifications
    ]

    return DoctorVerificationStatus(
        status=doctor.verification_status,
        certifications=certs_records,
    )


@router.get(
    "/api/v1/admin/doctors",
    response_model=DoctorList,
    summary="Admin: List registered doctors with search, status filter, and pagination",
)
def list_doctors(
    search: str | None = Query(default=None, description="Search doctor name, email, license, or pincode"),
    status: str | None = Query(default=None, description="Filter by status: pending, approved, rejected"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> DoctorList:
    query = db.query(Doctor).join(Doctor.user)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Doctor.full_name.ilike(search_filter),
                Doctor.medical_license_number.ilike(search_filter),
                Doctor.specialty.ilike(search_filter),
                Doctor.qualification.ilike(search_filter),
                Doctor.pincode.ilike(search_filter),
                Doctor.phone.ilike(search_filter),
                Doctor.invite_code.ilike(search_filter),
                User.email.ilike(search_filter),
            )
        )

    if status and status.lower() != "all":
        clean_status = status.lower()
        if "pending" in clean_status or "review" in clean_status:
            clean_status = "pending"
        elif "verif" in clean_status or "approv" in clean_status:
            clean_status = "approved"
        elif "reject" in clean_status:
            clean_status = "rejected"
        query = query.filter(Doctor.verification_status == clean_status)

    query = query.order_by(Doctor.created_at.desc())

    total = query.count()
    doctors = query.offset(offset).limit(limit).all()

    return DoctorList(
        items=[_build_doctor_profile(d) for d in doctors],
        total=total,
    )


@router.get(
    "/api/v1/admin/doctors/{doctorId}",
    response_model=DoctorProfile,
    summary="Admin: Get specific doctor profile by ID",
)
def get_doctor(
    doctor_id: str = Path(alias="doctorId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> DoctorProfile:
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )
    return _build_doctor_profile(doctor)


@router.patch(
    "/api/v1/admin/doctors/{doctorId}/verification",
    response_model=DoctorProfile,
    summary="Admin: Decide doctor verification status",
)
def decide_doctor_verification(
    payload: VerificationDecision,
    doctor_id: str = Path(alias="doctorId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> DoctorProfile:
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    previous_status = doctor.verification_status
    doctor.verification_status = payload.decision
    if payload.notes:
        doctor.admin_notes = payload.notes

    # Resolve actor_id safely
    actor_user = db.query(User).filter(User.id == user["sub"]).first() if user and "sub" in user else None
    actor_id = actor_user.id if actor_user else None

    # Audit log entry for admin decision
    audit = AuditHistory(
        actor_id=actor_id,
        action="DOCTOR_VERIFICATION_DECISION",
        target_entity="Doctor",
        target_id=doctor.id,
        details={
            "previous_status": previous_status,
            "new_status": payload.decision,
            "notes": payload.notes,
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(doctor)
    return _build_doctor_profile(doctor)


@router.patch(
    "/api/v1/admin/doctors/{doctorId}",
    response_model=DoctorProfile,
    summary="Admin: Update doctor details and administrative notes",
)
def update_doctor_as_admin(
    payload: DoctorAdminUpdate,
    doctor_id: str = Path(alias="doctorId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> DoctorProfile:
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    if payload.full_name is not None:
        doctor.full_name = payload.full_name
    if payload.specialty is not None:
        doctor.specialty = payload.specialty
    if payload.admin_notes is not None:
        doctor.admin_notes = payload.admin_notes

    actor_user = db.query(User).filter(User.id == user["sub"]).first() if user and "sub" in user else None
    actor_id = actor_user.id if actor_user else None

    audit = AuditHistory(
        actor_id=actor_id,
        action="DOCTOR_ADMIN_UPDATE",
        target_entity="Doctor",
        target_id=doctor.id,
        details={"updated_fields": list(payload.model_dump(exclude_unset=True).keys())},
    )
    db.add(audit)

    db.commit()
    db.refresh(doctor)
    return _build_doctor_profile(doctor)
