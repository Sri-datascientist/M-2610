from datetime import datetime
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
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

router = APIRouter(tags=["referrals"])


# --- Schemas ---

class ReferralSubmission(BaseModel):
    referred_name: str = Field(min_length=1, max_length=200)
    referred_contact: str = Field(min_length=1, max_length=320)
    reason: str = Field(min_length=1, max_length=2000)


class ReferralRecord(ReferralSubmission):
    id: str
    referring_doctor_id: str
    status: Literal["submitted", "accepted", "completed", "declined"]
    score_awarded: int = Field(default=0, ge=0)
    created_at: datetime
    updated_at: datetime


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


def _build_referral_record(ref: DBReferral) -> ReferralRecord:
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
    )


# --- Endpoints ---

@router.post(
    "/api/v1/referrals",
    response_model=ReferralRecord,
    status_code=status.HTTP_201_CREATED,
)
async def create_referral(
    payload: ReferralSubmission,
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

    # Resolve doctor's associated User record to inspect email for self-referral prevention
    user_record = db.query(User).filter(User.id == user["sub"]).first()

    # Normalize inputs
    norm_contact = payload.referred_contact.strip().lower()
    norm_name = payload.referred_name.strip()

    # Prevent self-referral:
    # Check if contact matches doctor's account email or doctor's full name matches referred name exactly
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

    referral = DBReferral(
        referring_doctor_id=doctor.id,
        referred_name=norm_name,
        referred_contact=norm_contact,
        reason=payload.reason.strip(),
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
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(referral)
    return _build_referral_record(referral)


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
