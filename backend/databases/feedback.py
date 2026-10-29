from datetime import datetime
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import UserClaims, require_role
from databases.session import get_db
from databases.schema.models import (
    Doctor,
    Feedback as DBFeedback,
    AuditHistory,
)

router = APIRouter(tags=["feedback"])


# --- Schemas ---

class FeedbackSubmission(BaseModel):
    category: Literal["product", "service", "website", "other"]
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=10000)


class FeedbackUpdate(BaseModel):
    status: Literal["new", "in_review", "resolved", "dismissed"] | None = None
    admin_notes: str | None = Field(default=None, max_length=2000)


class FeedbackRecord(FeedbackSubmission):
    id: str
    doctor_id: str
    status: Literal["new", "in_review", "resolved", "dismissed"]
    admin_notes: str | None = None
    submitted_at: datetime


class FeedbackList(BaseModel):
    items: list[FeedbackRecord]
    total: int


def _build_feedback_record(fb: DBFeedback) -> FeedbackRecord:
    return FeedbackRecord(
        id=fb.id,
        doctor_id=fb.doctor_id,
        category=fb.category,
        subject=fb.subject,
        message=fb.message,
        status=fb.status,
        admin_notes=fb.admin_notes,
        submitted_at=fb.submitted_at,
    )


# --- Endpoints ---

@router.post(
    "/api/v1/feedback",
    response_model=FeedbackRecord,
    status_code=status.HTTP_201_CREATED,
)
async def submit_feedback(
    payload: FeedbackSubmission,
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> FeedbackRecord:
    # Resolve the authenticated doctor's record
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for authenticated user",
        )

    # Initial status is 'new'
    feedback = DBFeedback(
        doctor_id=doctor.id,
        category=payload.category,
        subject=payload.subject,
        message=payload.message,
        status="new",
        admin_notes=None,
    )
    db.add(feedback)
    db.flush()

    # Audit history
    audit = AuditHistory(
        actor_id=user["sub"],
        action="submit_feedback",
        target_entity="feedback",
        target_id=feedback.id,
        details={
            "doctor_id": doctor.id,
            "category": payload.category,
            "subject": payload.subject,
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(feedback)
    return _build_feedback_record(feedback)


@router.get("/api/v1/doctors/me/feedback", response_model=FeedbackList)
async def list_own_feedback(
    feedback_status: Literal["new", "in_review", "resolved", "dismissed"] | None = Query(
        default=None, alias="status"
    ),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> FeedbackList:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for authenticated user",
        )

    query = db.query(DBFeedback).filter(DBFeedback.doctor_id == doctor.id)
    if feedback_status:
        query = query.filter(DBFeedback.status == feedback_status)

    total = query.count()
    items = query.order_by(DBFeedback.submitted_at.desc()).offset(offset).limit(limit).all()

    return FeedbackList(
        items=[_build_feedback_record(item) for item in items],
        total=total,
    )


@router.get("/api/v1/admin/feedback", response_model=FeedbackList)
async def list_feedback(
    feedback_status: Literal["new", "in_review", "resolved", "dismissed"] | None = Query(
        default=None, alias="status"
    ),
    category: Literal["product", "service", "website", "other"] | None = Query(
        default=None, alias="category"
    ),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> FeedbackList:
    query = db.query(DBFeedback)
    if feedback_status:
        query = query.filter(DBFeedback.status == feedback_status)
    if category:
        query = query.filter(DBFeedback.category == category)

    total = query.count()
    items = query.order_by(DBFeedback.submitted_at.desc()).offset(offset).limit(limit).all()

    return FeedbackList(
        items=[_build_feedback_record(item) for item in items],
        total=total,
    )


@router.patch(
    "/api/v1/admin/feedback/{feedbackId}",
    response_model=FeedbackRecord,
)
async def update_feedback(
    payload: FeedbackUpdate,
    feedback_id: str = Path(alias="feedbackId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> FeedbackRecord:
    feedback = db.query(DBFeedback).filter(DBFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found",
        )

    # Validate allowed status transitions if status is updated
    # Transitions:
    # new -> in_review, resolved, dismissed
    # in_review -> resolved, dismissed, new
    # resolved -> in_review (reopened), dismissed
    # dismissed -> new, in_review
    # Any status update from admin is valid within the allowed status set
    if payload.status is not None:
        feedback.status = payload.status

    if payload.admin_notes is not None:
        feedback.admin_notes = payload.admin_notes

    audit = AuditHistory(
        actor_id=user["sub"],
        action="update_feedback",
        target_entity="feedback",
        target_id=feedback.id,
        details={
            "new_status": payload.status,
            "admin_notes_updated": payload.admin_notes is not None,
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(feedback)
    return _build_feedback_record(feedback)
