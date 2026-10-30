from datetime import datetime
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.auth import (
    UserClaims,
    require_role,
    decode_access_token,
    bearer_scheme,
    hash_password,
)
from databases.session import get_db
from databases.schema.models import (
    User,
    Doctor,
    Referral as DBReferral,
    ColleagueInvitation,
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
    mobile: Optional[str] = Field(default=None, max_length=50)
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


class ColleagueInvitationRecord(BaseModel):
    id: str
    referring_doctor_id: Optional[str] = None
    inviting_doctor_name: str
    inviting_doctor_qualification: Optional[str] = None
    invite_code: str
    colleague_name: str
    colleague_email: str
    colleague_mobile: str
    qualification: str
    status: str
    email_dispatched: bool = False
    registration_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ColleagueInvitationStats(BaseModel):
    total_invitations: int
    registered_count: int
    verified_count: int
    email_dispatched_count: int


class ColleagueInvitationList(BaseModel):
    items: list[ColleagueInvitationRecord]
    total: int
    stats: ColleagueInvitationStats


class UpdateInvitationStatusPayload(BaseModel):
    status: str


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


def _get_optional_claims(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Optional[UserClaims]:
    """Helper to extract user claims if Bearer token is provided without hard-failing."""
    if not credentials:
        return None
    try:
        claims = decode_access_token(credentials.credentials)
        subject = claims.get("sub")
        role = claims.get("role")
        if isinstance(subject, str) and role in ("manufacturer", "doctor", "admin"):
            return {"sub": subject, "role": role}
    except Exception:
        pass
    return None


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
@router.post(
    "/api/v1/invitations",
    response_model=ReferralRecord,
    status_code=status.HTTP_201_CREATED,
)
async def create_referral(
    payload: ReferralSubmission,
    request: Request,
    claims: Optional[UserClaims] = Depends(_get_optional_claims),
    db: Session = Depends(get_db),
) -> ReferralRecord:
    # 1. Resolve the inviting doctor (authenticated or default seeded doctor)
    doctor = None
    if claims and claims.get("sub"):
        doctor = db.query(Doctor).filter(Doctor.user_id == claims["sub"]).first()
    if not doctor:
        doctor = db.query(Doctor).first()

    if not doctor:
        default_user = db.query(User).filter(User.role == "doctor").first()
        if not default_user:
            default_user = User(
                email="doctor@practice.com",
                hashed_password=hash_password("Doctor123!"),
                role="doctor",
                status="active",
            )
            db.add(default_user)
            db.flush()
        doctor = Doctor(
            user_id=default_user.id,
            full_name="Dr. Arnould",
            medical_license_number="AYUSH-MH-2022-9182",
            specialty="Ayurveda (BAMS)",
            invite_code="DRA33",
            verification_status="approved",
        )
        db.add(doctor)
        db.flush()

    # 2. Resolve target 4-question parameters
    target_name = (payload.name or payload.referred_name or "").strip()
    target_contact = (payload.email or payload.referred_contact or "").strip()
    target_mobile = (payload.mobile or "").strip()
    target_qual = (payload.qualification or "").strip() or "BAMS — Ayurveda"

    if not target_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Colleague's full name is required",
        )
    if not target_contact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Colleague's email address is required",
        )

    norm_contact = target_contact.lower()
    norm_name = target_name
    norm_mobile = target_mobile or "+91 98765 43210"

    # Prevent self-referral
    user_record = db.query(User).filter(User.id == doctor.user_id).first() if doctor.user_id else None
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

    # Check for duplicate submission when called via /api/v1/referrals
    if request.url.path.endswith("/referrals"):
        existing_dup = (
            db.query(DBReferral)
            .filter(
                DBReferral.referring_doctor_id == doctor.id,
                DBReferral.referred_contact == norm_contact,
            )
            .first()
        )
        if existing_dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A referral for this contact has already been created by you",
            )

    # 3. Ensure doctor has an invite code
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

    # 4. Build 1-click registration URL with query params
    origin = request.headers.get("origin") or request.headers.get("referer")
    base_url = "http://localhost:3000"
    if origin:
        import urllib.parse
        parsed = urllib.parse.urlparse(origin)
        base_url = f"{parsed.scheme}://{parsed.netloc}"

    import urllib.parse
    query_params = urllib.parse.urlencode({
        "ref": doctor.invite_code,
        "name": norm_name,
        "email": norm_contact,
        "mobile": norm_mobile,
        "qualification": target_qual,
    })
    reg_url = f"{base_url.rstrip('/')}/register?{query_params}"

    # 5. Dispatch personalized email
    email_dispatched = False
    if "@" in norm_contact:
        try:
            inv_res = email_otp_service.send_colleague_invitation(
                colleague_name=norm_name,
                colleague_email=norm_contact,
                colleague_mobile=norm_mobile,
                colleague_qualification=target_qual,
                inviter_name=doctor.full_name,
                inviter_qualification=doctor.qualification or "BAMS",
                invite_code=doctor.invite_code,
                app_url=base_url,
            )
            email_dispatched = inv_res.get("dispatched", False)
            if inv_res.get("registration_url"):
                reg_url = inv_res["registration_url"]
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Failed to dispatch colleague invitation email: %s", exc)

    # 6. Save in database: ColleagueInvitation table
    colleague_inv = (
        db.query(ColleagueInvitation)
        .filter(
            ColleagueInvitation.referring_doctor_id == doctor.id,
            ColleagueInvitation.colleague_email == norm_contact,
        )
        .first()
    )
    if not colleague_inv:
        colleague_inv = ColleagueInvitation(
            referring_doctor_id=doctor.id,
            inviting_doctor_name=doctor.full_name,
            inviting_doctor_qualification=doctor.qualification or "BAMS",
            invite_code=doctor.invite_code,
            colleague_name=norm_name,
            colleague_email=norm_contact,
            colleague_mobile=norm_mobile,
            qualification=target_qual,
            status="Invitation Sent",
            email_dispatched=email_dispatched,
            registration_url=reg_url,
            notes=f"Invited by {doctor.full_name} ({doctor.invite_code})",
        )
        db.add(colleague_inv)
    else:
        colleague_inv.colleague_name = norm_name
        colleague_inv.colleague_mobile = norm_mobile
        colleague_inv.qualification = target_qual
        colleague_inv.email_dispatched = email_dispatched
        colleague_inv.registration_url = reg_url
        colleague_inv.updated_at = datetime.now()

    # 7. Mirror in legacy Referral table for score compatibility
    target_reason = f"Qualification: {target_qual} · Mobile: {norm_mobile}"
    referral = (
        db.query(DBReferral)
        .filter(
            DBReferral.referring_doctor_id == doctor.id,
            DBReferral.referred_contact == norm_contact,
        )
        .first()
    )
    if not referral:
        referral = DBReferral(
            referring_doctor_id=doctor.id,
            referred_name=norm_name,
            referred_contact=norm_contact,
            reason=target_reason,
            status="submitted",
            score_awarded=0,
        )
        db.add(referral)
    else:
        referral.referred_name = norm_name
        referral.reason = target_reason

    db.flush()

    # Audit history
    actor_id = claims["sub"] if (claims and claims.get("sub")) else (doctor.user_id or "doc-local")
    is_referral_endpoint = request.url.path.endswith("/referrals")
    audit = AuditHistory(
        actor_id=actor_id,
        action="create_referral" if is_referral_endpoint else "create_colleague_invitation",
        target_entity="referrals" if is_referral_endpoint else "colleague_invitations",
        target_id=referral.id if is_referral_endpoint else colleague_inv.id,
        details={
            "referring_doctor_id": doctor.id,
            "referred_name": norm_name,
            "colleague_email": norm_contact,
            "qualification": target_qual,
            "mobile": norm_mobile,
            "invite_code": doctor.invite_code,
            "email_dispatched": email_dispatched,
            "referral_id": referral.id,
            "colleague_invitation_id": colleague_inv.id,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(referral)
    db.refresh(colleague_inv)

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
    claims: Optional[UserClaims] = Depends(_get_optional_claims),
    db: Session = Depends(get_db),
) -> ReferralList:
    if not claims or not claims.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    if claims.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Doctor role required")

    doctor = db.query(Doctor).filter(Doctor.user_id == claims["sub"]).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")

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
    claims: Optional[UserClaims] = Depends(_get_optional_claims),
    db: Session = Depends(get_db),
) -> ReferralScore:
    if not claims or not claims.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    if claims.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Doctor role required")

    doctor = db.query(Doctor).filter(Doctor.user_id == claims["sub"]).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")

    score, count = calculate_doctor_referral_score(doctor.id, db)
    return ReferralScore(
        doctor_id=doctor.id,
        score=score,
        referral_count=count,
    )


@router.get("/api/v1/referrals/my-summary")
async def get_doctor_referral_summary(
    claims: Optional[UserClaims] = Depends(_get_optional_claims),
    db: Session = Depends(get_db),
):
    doctor = None
    if claims and claims.get("sub"):
        doctor = db.query(Doctor).filter(Doctor.user_id == claims["sub"]).first()
    if not doctor:
        doctor = db.query(Doctor).first()

    if not doctor:
        return {
            "invite_code": "DRA33",
            "invite_url": "/register?ref=DRA33",
            "referral_count": 0,
            "total_rewards": 0,
            "joined_doctors": [],
        }

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

    referrals = (
        db.query(ColleagueInvitation)
        .filter(ColleagueInvitation.referring_doctor_id == doctor.id)
        .order_by(ColleagueInvitation.created_at.desc())
        .all()
    )

    joined_docs = (
        db.query(Doctor)
        .filter(Doctor.referred_by_invite_code == doctor.invite_code)
        .order_by(Doctor.created_at.desc())
        .all()
    )

    total_count = max(len(referrals), len(joined_docs))
    total_rewards = total_count * 10

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


# ============================================================================
# ADMIN INVITATION ENDPOINTS (For Admin Dashboard)
# ============================================================================

@router.get(
    "/api/v1/admin/invitations",
    response_model=ColleagueInvitationList,
)
async def list_colleague_invitations_for_admin(
    q: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    claims: Optional[UserClaims] = Depends(_get_optional_claims),
    db: Session = Depends(get_db),
) -> ColleagueInvitationList:
    """
    Fetch all colleague invitations from the database for the Admin Dashboard.
    Supports real-time search, status filtering, and summary statistics.
    """
    # Sync any legacy referrals into ColleagueInvitation so all historical records appear
    legacy_referrals = db.query(DBReferral).all()
    for ref in legacy_referrals:
        existing = db.query(ColleagueInvitation).filter(
            ColleagueInvitation.colleague_email == ref.referred_contact.lower()
        ).first()
        if not existing:
            doc = db.query(Doctor).filter(Doctor.id == ref.referring_doctor_id).first()
            qual = "BAMS — Ayurveda"
            mobile = ""
            if "Qualification:" in ref.reason:
                parts = ref.reason.split("·")
                for p in parts:
                    if "Qualification:" in p:
                        qual = p.replace("Qualification:", "").strip()
                    elif "Mobile:" in p:
                        mobile = p.replace("Mobile:", "").strip()
            new_inv = ColleagueInvitation(
                referring_doctor_id=ref.referring_doctor_id,
                inviting_doctor_name=doc.full_name if doc else "Dr. Arnould",
                inviting_doctor_qualification=doc.qualification if doc else "BAMS",
                invite_code=doc.invite_code if doc and doc.invite_code else "DRA33",
                colleague_name=ref.referred_name,
                colleague_email=ref.referred_contact.lower(),
                colleague_mobile=mobile or "+91 98765 43210",
                qualification=qual,
                status="Invitation Sent",
                email_dispatched=True,
                created_at=ref.created_at,
                updated_at=ref.updated_at,
            )
            db.add(new_inv)
            try:
                db.commit()
            except Exception:
                db.rollback()

    query = db.query(ColleagueInvitation)

    if status and status != "All":
        query = query.filter(ColleagueInvitation.status == status)

    if q and q.strip():
        search_term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(ColleagueInvitation.colleague_name).like(search_term),
                func.lower(ColleagueInvitation.colleague_email).like(search_term),
                func.lower(ColleagueInvitation.colleague_mobile).like(search_term),
                func.lower(ColleagueInvitation.qualification).like(search_term),
                func.lower(ColleagueInvitation.inviting_doctor_name).like(search_term),
                func.lower(ColleagueInvitation.invite_code).like(search_term),
            )
        )

    total = query.count()
    items = query.order_by(ColleagueInvitation.created_at.desc()).offset(offset).limit(limit).all()

    # Calculate real-time stats
    all_invs = db.query(ColleagueInvitation).all()
    total_invitations = len(all_invs)
    registered_count = sum(1 for i in all_invs if i.status in ("Registered", "Council Verified", "Access Active"))
    verified_count = sum(1 for i in all_invs if i.status in ("Council Verified", "Access Active"))
    email_dispatched_count = sum(1 for i in all_invs if i.email_dispatched)

    stats = ColleagueInvitationStats(
        total_invitations=total_invitations,
        registered_count=registered_count,
        verified_count=verified_count,
        email_dispatched_count=email_dispatched_count,
    )

    records = [
        ColleagueInvitationRecord(
            id=item.id,
            referring_doctor_id=item.referring_doctor_id,
            inviting_doctor_name=item.inviting_doctor_name,
            inviting_doctor_qualification=item.inviting_doctor_qualification,
            invite_code=item.invite_code,
            colleague_name=item.colleague_name,
            colleague_email=item.colleague_email,
            colleague_mobile=item.colleague_mobile,
            qualification=item.qualification,
            status=item.status,
            email_dispatched=item.email_dispatched,
            registration_url=item.registration_url,
            notes=item.notes,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in items
    ]

    return ColleagueInvitationList(items=records, total=total, stats=stats)


@router.patch("/api/v1/admin/invitations/{invitation_id}/status")
async def update_invitation_status(
    invitation_id: str,
    payload: UpdateInvitationStatusPayload,
    db: Session = Depends(get_db),
):
    inv = db.query(ColleagueInvitation).filter(ColleagueInvitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    inv.status = payload.status
    inv.updated_at = datetime.now()
    db.commit()
    return {"success": True, "id": inv.id, "status": inv.status}


@router.post("/api/v1/admin/invitations/{invitation_id}/resend")
async def resend_invitation(
    invitation_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    inv = db.query(ColleagueInvitation).filter(ColleagueInvitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")

    origin = request.headers.get("origin") or "http://localhost:3000"
    res = email_otp_service.send_colleague_invitation(
        colleague_name=inv.colleague_name,
        colleague_email=inv.colleague_email,
        colleague_mobile=inv.colleague_mobile,
        colleague_qualification=inv.qualification,
        inviter_name=inv.inviting_doctor_name,
        inviter_qualification=inv.inviting_doctor_qualification or "BAMS",
        invite_code=inv.invite_code,
        app_url=origin,
    )
    inv.email_dispatched = res.get("dispatched", True)
    if res.get("registration_url"):
        inv.registration_url = res["registration_url"]
    inv.updated_at = datetime.now()
    db.commit()
    return {"success": True, "id": inv.id, "email_dispatched": inv.email_dispatched}


@router.delete("/api/v1/admin/invitations/{invitation_id}")
async def delete_invitation(
    invitation_id: str,
    db: Session = Depends(get_db),
):
    inv = db.query(ColleagueInvitation).filter(ColleagueInvitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    db.delete(inv)
    db.commit()
    return {"success": True, "deleted_id": invitation_id}


@router.get("/api/v1/admin/referrals", response_model=ReferralList)
async def list_referrals_for_admin(
    referral_status: Literal["submitted", "accepted", "completed", "declined"] | None = Query(
        default=None, alias="status"
    ),
    doctor_id: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    claims: Optional[UserClaims] = Depends(_get_optional_claims),
    db: Session = Depends(get_db),
) -> ReferralList:
    if not claims or not claims.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    if claims.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Admin role required")

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
    claims: Optional[UserClaims] = Depends(_get_optional_claims),
    db: Session = Depends(get_db),
) -> ReferralLeaderboard:
    if not claims or not claims.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    if claims.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Admin role required")

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
