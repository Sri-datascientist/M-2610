from datetime import datetime
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import UserClaims, require_role, require_roles
from databases.session import get_db
from databases.schema.models import (
    Doctor,
    ResearchSubmission as DBResearchSubmission,
    AuditHistory,
)

router = APIRouter(tags=["research submissions"])


# --- Schemas ---

class ResearchSubmissionPayload(BaseModel):
    submission_type: Literal["formulation", "medical_details", "case_study"]
    title: str = Field(min_length=1, max_length=300)
    summary: str = Field(min_length=1, max_length=2000)
    content: str = Field(min_length=1, max_length=20000)
    attachments: list[str] = Field(default_factory=list, max_length=20)


class ResearchSubmissionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    summary: str | None = Field(default=None, min_length=1, max_length=2000)
    content: str | None = Field(default=None, min_length=1, max_length=20000)
    attachments: list[str] | None = Field(default=None, max_length=20)


class ResearchSubmission(ResearchSubmissionPayload):
    id: str
    doctor_id: str
    status: Literal["submitted", "under_review", "approved", "rejected", "returned"]
    submitted_at: datetime


class ResearchSubmissionList(BaseModel):
    items: list[ResearchSubmission]
    total: int


def _build_research_submission(sub: DBResearchSubmission) -> ResearchSubmission:
    return ResearchSubmission(
        id=sub.id,
        doctor_id=sub.doctor_id,
        submission_type=sub.submission_type,
        title=sub.title,
        summary=sub.summary,
        content=sub.content,
        attachments=sub.attachments or [],
        status=sub.status,
        submitted_at=sub.submitted_at,
    )


# --- Endpoints ---

@router.post(
    "/api/v1/research-submissions",
    response_model=ResearchSubmission,
    status_code=status.HTTP_201_CREATED,
    summary="Doctor: Submit a new research formulation or case study",
)
def submit_research(
    payload: ResearchSubmissionPayload,
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> ResearchSubmission:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found.",
        )

    new_submission = DBResearchSubmission(
        doctor_id=doctor.id,
        submission_type=payload.submission_type,
        title=payload.title,
        summary=payload.summary,
        content=payload.content,
        attachments=payload.attachments,
        status="submitted",  # Initial status
    )
    db.add(new_submission)

    audit = AuditHistory(
        actor_id=user["sub"],
        action="RESEARCH_SUBMISSION_CREATED",
        target_entity="ResearchSubmission",
        target_id=new_submission.id,
        details={
            "submission_type": new_submission.submission_type,
            "title": new_submission.title,
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(new_submission)
    return _build_research_submission(new_submission)


@router.get(
    "/api/v1/doctors/me/research-submissions",
    response_model=ResearchSubmissionList,
    summary="Doctor: List own submitted research papers",
)
def list_own_research_submissions(
    submission_status: Literal["submitted", "under_review", "approved", "rejected", "returned"]
    | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> ResearchSubmissionList:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found.",
        )

    query = db.query(DBResearchSubmission).filter(DBResearchSubmission.doctor_id == doctor.id)

    if submission_status is not None:
        query = query.filter(DBResearchSubmission.status == submission_status)

    query = query.order_by(DBResearchSubmission.submitted_at.desc())
    total = query.count()
    submissions = query.offset(offset).limit(limit).all()

    return ResearchSubmissionList(
        items=[_build_research_submission(s) for s in submissions],
        total=total,
    )


@router.get(
    "/api/v1/research-submissions/{submissionId}",
    response_model=ResearchSubmission,
    summary="Get research submission details by ID (Doctor owner or Admin only)",
)
def get_research_submission(
    submission_id: str = Path(alias="submissionId"),
    user: UserClaims = Depends(require_roles("doctor", "admin")),
    db: Session = Depends(get_db),
) -> ResearchSubmission:
    submission = db.query(DBResearchSubmission).filter(
        DBResearchSubmission.id == submission_id
    ).first()
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research submission not found.",
        )

    # Ownership check: If caller is doctor, they must be the author
    if user["role"] == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
        if doctor is None or submission.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this submission.",
            )

    return _build_research_submission(submission)


@router.patch(
    "/api/v1/research-submissions/{submissionId}",
    response_model=ResearchSubmission,
    summary="Update research submission (Doctor owner while editable, or Admin)",
)
def update_research_submission(
    payload: ResearchSubmissionUpdate,
    submission_id: str = Path(alias="submissionId"),
    user: UserClaims = Depends(require_roles("doctor", "admin")),
    db: Session = Depends(get_db),
) -> ResearchSubmission:
    submission = db.query(DBResearchSubmission).filter(
        DBResearchSubmission.id == submission_id
    ).first()
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research submission not found.",
        )

    # Ownership & editability check
    if user["role"] == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
        if doctor is None or submission.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this submission.",
            )
        # Prevent edits once approved
        if submission.status == "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approved research submissions cannot be modified.",
            )

    if payload.title is not None:
        submission.title = payload.title
    if payload.summary is not None:
        submission.summary = payload.summary
    if payload.content is not None:
        submission.content = payload.content
    if payload.attachments is not None:
        submission.attachments = payload.attachments

    audit = AuditHistory(
        actor_id=user["sub"],
        action="RESEARCH_SUBMISSION_UPDATED",
        target_entity="ResearchSubmission",
        target_id=submission.id,
        details={"updated_fields": list(payload.model_dump(exclude_unset=True).keys())},
    )
    db.add(audit)

    db.commit()
    db.refresh(submission)
    return _build_research_submission(submission)


@router.get(
    "/api/v1/admin/research-submissions",
    response_model=ResearchSubmissionList,
    summary="Admin: List all research submissions across doctors",
)
def list_research_submissions_for_admin(
    submission_status: Literal["submitted", "under_review", "approved", "rejected", "returned"]
    | None = Query(default=None, alias="status"),
    submission_type: Literal["formulation", "medical_details", "case_study"] | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> ResearchSubmissionList:
    query = db.query(DBResearchSubmission)

    if submission_status is not None:
        query = query.filter(DBResearchSubmission.status == submission_status)

    if submission_type is not None:
        query = query.filter(DBResearchSubmission.submission_type == submission_type)

    query = query.order_by(DBResearchSubmission.submitted_at.desc())
    total = query.count()
    submissions = query.offset(offset).limit(limit).all()

    return ResearchSubmissionList(
        items=[_build_research_submission(s) for s in submissions],
        total=total,
    )
