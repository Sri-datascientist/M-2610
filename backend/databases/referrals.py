from datetime import datetime
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import UserClaims, require_role
from databases.session import get_db
from databases.schema.models import (
    User,
    Doctor,
    Referral as DBReferral,
    AuditHistory,
)
from app.services.referral_scoring import (
    calculate_doctor_referral_score,
    get_referral_leaderboard_data,
)
from app.services.email_otp_service import email_otp_service

router = APIRouter(tags=["referrals"])


# --- Schemas ---

class ReferralSubmission(BaseModel):
    # Backward compatible fields
    referred_name: Optional[str] = Field(default=None, max_length=200)
    referred_contact: Optional[str] = Field(default=None, max_length=320)
    reason: Optional[str] = Field(default=None, max_length=2000)

    # 4-question fields
    name: Optional[str] = Field(default=None, max_length=200)
    email: Optional[str] = Field(default=None, max_length=320)
    mobile: Optional[str] = Field(default=None, max_length=30)
    qualification: Optional[str] = Field(default=None, max_length=100)


class ReferralRecord(BaseModel):
    id: str
    referring_doctor_id: str
    referred_name: str
    referred_contact: str
    reason: str
    status: Literal["submitted", "accepted", "completed", "declined"]
    score_awarded: int = Field(default=0, ge=0)
    created_at: datetime
    updated_at: datetime
    invite_code: Optional[str] = None
    registration_url: Optional[str] = None
    email_dispatched: Optional[bool] = None


class ReferralList(BaseModel):
    items: list[ReferralRecord]
    total: int


class ReferralScore(BaseModel):
    doctor_id: str
    score: int = Field(ge=0)
    referral_count: int = Field(ge=0)


class ReferralLeaderboardEntry(ReferralScore):
    doctor_name: str
    rank: int = Field(ge=1)


class ReferralLeaderboard(BaseModel):
    items: list[ReferralLeaderboardEntry]
    total: int


def _build_referral_record(
    ref: DBReferral,
    invite_code: Optional[str] = None,
    registration_url: Optional[str] = None,
    email_dispatched: Optional[bool] = None,
) -> ReferralRecord:
    return ReferralRecord(
        id=ref.id,
        referring_doctor_id=ref.referring_doctor_id,
        referred_name=ref.referred_name,
        referred_contact=ref.referred_contact,
        reason=ref.reason,
        status=ref.status,
        score_awarded=ref.score_awarded,
        created_at=ref.created_at,
        updated_at=ref.updated_at,
        invite_code=invite_code,
        registration_url=registration_url,
        email_dispatched=email_dispatched,
    )


# --- Endpoints ---

@router.post(
    "/api/v1/referrals",
    response_model=ReferralRecord,
    status_code=status.HTTP_201_CREATED,
)
async def create_referral(
    payload: ReferralSubmission,
    request: Request,
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> ReferralRecord:
    # Resolve the authenticated doctor
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for authenticated user",
        )

    # Resolve target name and contact from either 4-question format or legacy format
    target_name = (payload.name or payload.referred_name or "").strip()
    target_contact = (payload.email or payload.referred_contact or "").strip()
    target_mobile = (payload.mobile or "").strip()
    target_qual = (payload.qualification or "").strip()

    if not target_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Colleague's name is required",
        )
    if not target_contact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Colleague's email or contact is required",
        )

    target_reason = payload.reason
    if not target_reason:
        details_list = []
        if target_qual:
            details_list.append(f"Qualification: {target_qual}")
        if target_mobile:
            details_list.append(f"Mobile: {target_mobile}")
        target_reason = " · ".join(details_list) if details_list else "Peer Colleague Invitation"

    # Resolve doctor's associated User record to inspect email for self-referral prevention
    user_record = db.query(User).filter(User.id == user["sub"]).first()

    # Normalize inputs
    norm_contact = target_contact.lower()
    norm_name = target_name

    # Prevent self-referral:
    if user_record and user_record.email.strip().lower() == norm_contact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self-referrals are not permitted",
        )
    if doctor.full_name.strip().lower() == norm_name.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self-referrals are not permitted",
        )

    # Prevent duplicate referral from the same doctor to the same contact
    existing = (
        db.query(DBReferral)
        .filter(
            DBReferral.referring_doctor_id == doctor.id,
            DBReferral.referred_contact == norm_contact,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A referral for this contact has already been created by you",
        )

    # Ensure doctor has an invite code
    if not doctor.invite_code:
        import random, string
        clean = "".join([c for c in doctor.full_name.upper() if c in string.ascii_uppercase])
        prefix = clean[:3] if len(clean) >= 3 else "".join(random.choices(string.ascii_uppercase, k=3))
        while True:
            candidate = f"{prefix}{random.randint(10, 99)}"
            if not db.query(Doctor).filter(Doctor.invite_code == candidate).first():
                doctor.invite_code = candidate
                db.commit()
                db.refresh(doctor)
                break

    referral = DBReferral(
        referring_doctor_id=doctor.id,
        referred_name=norm_name,
        referred_contact=norm_contact,
        reason=target_reason.strip(),
        status="submitted",
        score_awarded=0,
    )
    db.add(referral)
    db.flush()

    # Log action to audit history
    audit = AuditHistory(
        actor_id=user["sub"],
        action="create_referral",
        target_entity="referral",
        target_id=referral.id,
        details={
            "referring_doctor_id": doctor.id,
            "referred_name": norm_name,
            "qualification": target_qual,
            "mobile": target_mobile,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(referral)

    # Automatically dispatch invitation email if contact is an email address
    email_dispatched = False
    reg_url = None
    if "@" in norm_contact:
        origin = request.headers.get("origin") or request.headers.get("referer")
        base_url = "http://localhost:3000"
        if origin:
            import urllib.parse
            parsed = urllib.parse.urlparse(origin)
            base_url = f"{parsed.scheme}://{parsed.netloc}"

        try:
            inv_res = email_otp_service.send_colleague_invitation(
                colleague_name=norm_name,
                colleague_email=norm_contact,
                colleague_mobile=target_mobile,
                colleague_qualification=target_qual or "BAMS",
                inviter_name=doctor.full_name,
                inviter_qualification=doctor.qualification or "Vaidya",
                invite_code=doctor.invite_code,
                app_url=base_url,
            )
            email_dispatched = inv_res.get("dispatched", False)
            reg_url = inv_res.get("registration_url")
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Failed to dispatch colleague invitation email: %s", exc)

    return _build_referral_record(
        referral,
        invite_code=doctor.invite_code,
        registration_url=reg_url,
        email_dispatched=email_dispatched,
    )


@router.get("/api/v1/doctors/me/referrals", response_model=ReferralList)
async def list_own_referrals(
    referral_status: Literal["submitted", "accepted", "completed", "declined"] | None = Query(
        default=None, alias="status"
    ),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> ReferralList:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for authenticated user",
        )

    query = db.query(DBReferral).filter(DBReferral.referring_doctor_id == doctor.id)
    if referral_status:
        query = query.filter(DBReferral.status == referral_status)

    total = query.count()
    items = query.order_by(DBReferral.created_at.desc()).offset(offset).limit(limit).all()

    return ReferralList(
        items=[_build_referral_record(item) for item in items],
        total=total,
    )


@router.get("/api/v1/doctors/me/referral-score", response_model=ReferralScore)
async def get_own_referral_score(
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> ReferralScore:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for authenticated user",
        )

    score, count = calculate_doctor_referral_score(doctor.id, db)
    return ReferralScore(
        doctor_id=doctor.id,
        score=score,
        referral_count=count,
    )


@router.get("/api/v1/referrals/my-summary")
async def get_doctor_referral_summary(
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
):
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for authenticated user",
        )

    # Ensure doctor has an invite code
    if not doctor.invite_code:
        import random, string
        clean = "".join([c for c in doctor.full_name.upper() if c in string.ascii_uppercase])
        prefix = clean[:3] if len(clean) >= 3 else "".join(random.choices(string.ascii_uppercase, k=3))
        while True:
            candidate = f"{prefix}{random.randint(10, 99)}"
            if not db.query(Doctor).filter(Doctor.invite_code == candidate).first():
                doctor.invite_code = candidate
                db.commit()
                db.refresh(doctor)
                break

    # Get referrals initiated by doctor
    referrals = (
        db.query(DBReferral)
        .filter(DBReferral.referring_doctor_id == doctor.id)
        .order_by(DBReferral.created_at.desc())
        .all()
    )

    # Also count doctors registered with this doctor's invite code
    joined_docs = (
        db.query(Doctor)
        .filter(Doctor.referred_by_invite_code == doctor.invite_code)
        .order_by(Doctor.created_at.desc())
        .all()
    )

    total_count = max(len(referrals), len(joined_docs))
    total_rewards = sum(r.score_awarded for r in referrals) if referrals else total_count * 10

    return {
        "invite_code": doctor.invite_code,
        "invite_url": f"/register?ref={doctor.invite_code}",
        "referral_count": total_count,
        "total_rewards": total_rewards,
        "joined_doctors": [
            {
                "id": d.id,
                "name": d.full_name,
                "qualification": d.qualification,
                "status": "Reward Recorded",
                "registered_at": d.created_at.strftime("%d %b %Y"),
            }
            for d in joined_docs
        ],
    }


@router.get("/api/v1/admin/referrals", response_model=ReferralList)
async def list_referrals_for_admin(
    referral_status: Literal["submitted", "accepted", "completed", "declined"] | None = Query(
        default=None, alias="status"
    ),
    doctor_id: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> ReferralList:
    query = db.query(DBReferral)
    if referral_status:
        query = query.filter(DBReferral.status == referral_status)
    if doctor_id:
        query = query.filter(DBReferral.referring_doctor_id == doctor_id)

    total = query.count()
    items = query.order_by(DBReferral.created_at.desc()).offset(offset).limit(limit).all()

    return ReferralList(
        items=[_build_referral_record(item) for item in items],
        total=total,
    )


@router.get("/api/v1/admin/referral-leaderboard", response_model=ReferralLeaderboard)
async def get_referral_leaderboard(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> ReferralLeaderboard:
    items, total = get_referral_leaderboard_data(db, limit=limit, offset=offset)
    return ReferralLeaderboard(
        items=[
            ReferralLeaderboardEntry(
                doctor_id=item["doctor_id"],
                doctor_name=item["doctor_name"],
                score=item["score"],
                referral_count=item["referral_count"],
                rank=item["rank"],
            )
            for item in items
        ],
        total=total,
    )
