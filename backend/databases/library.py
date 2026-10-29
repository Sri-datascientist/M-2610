from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth import UserClaims, require_role
from databases.session import get_db
from databases.schema.models import (
    Doctor,
    LibraryEntry as DBLibraryEntry,
    LibraryContribution as DBLibraryContribution,
    AuditHistory,
)

router = APIRouter(tags=["library"])


# --- Schemas ---

class LibraryEntrySubmission(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    summary: str = Field(min_length=1, max_length=2000)
    content: str = Field(min_length=1, max_length=20000)
    category: str = Field(min_length=1, max_length=100)
    source_references: list[str] = Field(default_factory=list, max_length=20)


class LibraryEntryUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    summary: str | None = Field(default=None, min_length=1, max_length=2000)
    content: str | None = Field(default=None, min_length=1, max_length=20000)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    source_references: list[str] | None = Field(default=None, max_length=20)
    is_published: bool | None = None


class LibraryEntry(LibraryEntrySubmission):
    id: str
    is_published: bool = True


class LibraryEntryList(BaseModel):
    items: list[LibraryEntry]
    total: int


class LibraryContributionSubmission(LibraryEntrySubmission):
    pass


class LibraryContribution(LibraryContributionSubmission):
    id: str
    doctor_id: str
    decision: Literal["pending", "approved", "rejected", "returned"]
    reviewer_notes: str | None = None


class LibraryContributionList(BaseModel):
    items: list[LibraryContribution]
    total: int


class ContributionDecision(BaseModel):
    decision: Literal["approved", "rejected", "returned"]
    notes: str | None = Field(default=None, max_length=2000)


def _build_library_entry(entry: DBLibraryEntry) -> LibraryEntry:
    return LibraryEntry(
        id=entry.id,
        title=entry.title,
        summary=entry.summary,
        content=entry.content,
        category=entry.category,
        source_references=entry.source_references or [],
        is_published=entry.is_published,
    )


def _build_library_contribution(contrib: DBLibraryContribution) -> LibraryContribution:
    return LibraryContribution(
        id=contrib.id,
        doctor_id=contrib.doctor_id,
        title=contrib.title,
        summary=contrib.summary,
        content=contrib.content,
        category=contrib.category,
        source_references=contrib.source_references or [],
        decision=contrib.decision,
        reviewer_notes=contrib.reviewer_notes,
    )


# --- Endpoints ---

@router.get(
    "/api/v1/library/entries",
    response_model=LibraryEntryList,
    summary="Public: Browse published library entries",
)
@router.get(
    "/api/library/entries",
    response_model=LibraryEntryList,
    summary="Public: Browse published library entries (alias)",
)
def browse_library_entries(
    search: str | None = Query(default=None, description="Search library entry title or content"),
    category: str | None = Query(default=None, min_length=1, max_length=100),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> LibraryEntryList:
    # Public catalog only returns published entries
    query = db.query(DBLibraryEntry).filter(DBLibraryEntry.is_published.is_(True))

    if category:
        query = query.filter(DBLibraryEntry.category.ilike(category))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                DBLibraryEntry.title.ilike(search_filter),
                DBLibraryEntry.content.ilike(search_filter),
                DBLibraryEntry.summary.ilike(search_filter),
            )
        )

    total = query.count()
    entries = query.offset(offset).limit(limit).all()

    return LibraryEntryList(
        items=[_build_library_entry(e) for e in entries],
        total=total,
    )


@router.get(
    "/api/v1/library/entries/{entryId}",
    response_model=LibraryEntry,
    summary="Public: Get a published library entry by ID",
)
def get_library_entry(
    entry_id: str = Path(alias="entryId"),
    db: Session = Depends(get_db),
) -> LibraryEntry:
    entry = db.query(DBLibraryEntry).filter(
        DBLibraryEntry.id == entry_id,
        DBLibraryEntry.is_published.is_(True),
    ).first()

    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library entry not found.",
        )
    return _build_library_entry(entry)


@router.post(
    "/api/v1/library/contributions",
    response_model=LibraryContribution,
    status_code=status.HTTP_201_CREATED,
    summary="Doctor: Submit an article contribution for review",
)
def submit_library_contribution(
    payload: LibraryContributionSubmission,
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> LibraryContribution:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found.",
        )

    new_contribution = DBLibraryContribution(
        doctor_id=doctor.id,
        title=payload.title,
        summary=payload.summary,
        content=payload.content,
        category=payload.category,
        source_references=payload.source_references,
        decision="pending",  # Newly submitted contributions always start as pending
    )
    db.add(new_contribution)

    audit = AuditHistory(
        actor_id=user["sub"],
        action="LIBRARY_CONTRIBUTION_SUBMITTED",
        target_entity="LibraryContribution",
        target_id=new_contribution.id,
        details={"title": new_contribution.title, "category": new_contribution.category},
    )
    db.add(audit)

    db.commit()
    db.refresh(new_contribution)
    return _build_library_contribution(new_contribution)


@router.get(
    "/api/v1/doctors/me/library-contributions",
    response_model=LibraryContributionList,
    summary="Doctor: List own submitted contributions",
)
def list_own_library_contributions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
) -> LibraryContributionList:
    doctor = db.query(Doctor).filter(Doctor.user_id == user["sub"]).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found.",
        )

    query = db.query(DBLibraryContribution).filter(DBLibraryContribution.doctor_id == doctor.id)
    total = query.count()
    contributions = query.offset(offset).limit(limit).all()

    return LibraryContributionList(
        items=[_build_library_contribution(c) for c in contributions],
        total=total,
    )


@router.get(
    "/api/v1/admin/library/entries",
    response_model=LibraryEntryList,
    summary="Admin: List all library entries (published and unpublished)",
)
def list_library_entries_for_admin(
    search: str | None = Query(default=None, description="Search library entry title or content"),
    is_published: bool | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> LibraryEntryList:
    query = db.query(DBLibraryEntry)

    if is_published is not None:
        query = query.filter(DBLibraryEntry.is_published == is_published)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                DBLibraryEntry.title.ilike(search_filter),
                DBLibraryEntry.content.ilike(search_filter),
                DBLibraryEntry.summary.ilike(search_filter),
            )
        )

    total = query.count()
    entries = query.offset(offset).limit(limit).all()

    return LibraryEntryList(
        items=[_build_library_entry(e) for e in entries],
        total=total,
    )


@router.post(
    "/api/v1/admin/library/entries",
    response_model=LibraryEntry,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Publish/create an official library entry",
)
def create_library_entry(
    payload: LibraryEntrySubmission,
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> LibraryEntry:
    new_entry = DBLibraryEntry(
        title=payload.title,
        summary=payload.summary,
        content=payload.content,
        category=payload.category,
        source_references=payload.source_references,
        is_published=True,
    )
    db.add(new_entry)

    audit = AuditHistory(
        actor_id=user["sub"],
        action="LIBRARY_ENTRY_CREATED",
        target_entity="LibraryEntry",
        target_id=new_entry.id,
        details={"title": new_entry.title, "category": new_entry.category},
    )
    db.add(audit)

    db.commit()
    db.refresh(new_entry)
    return _build_library_entry(new_entry)


@router.patch(
    "/api/v1/admin/library/entries/{entryId}",
    response_model=LibraryEntry,
    summary="Admin: Update a library entry or toggle publication status",
)
def update_library_entry(
    payload: LibraryEntryUpdate,
    entry_id: str = Path(alias="entryId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> LibraryEntry:
    entry = db.query(DBLibraryEntry).filter(DBLibraryEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library entry not found.",
        )

    if payload.title is not None:
        entry.title = payload.title
    if payload.summary is not None:
        entry.summary = payload.summary
    if payload.content is not None:
        entry.content = payload.content
    if payload.category is not None:
        entry.category = payload.category
    if payload.source_references is not None:
        entry.source_references = payload.source_references
    if payload.is_published is not None:
        entry.is_published = payload.is_published

    audit = AuditHistory(
        actor_id=user["sub"],
        action="LIBRARY_ENTRY_UPDATED",
        target_entity="LibraryEntry",
        target_id=entry.id,
        details={"updated_fields": list(payload.model_dump(exclude_unset=True).keys())},
    )
    db.add(audit)

    db.commit()
    db.refresh(entry)
    return _build_library_entry(entry)


@router.get(
    "/api/v1/admin/library/contributions",
    response_model=LibraryContributionList,
    summary="Admin: List all doctor library contributions",
)
def list_library_contributions_for_admin(
    decision: Literal["pending", "approved", "rejected", "returned"] | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> LibraryContributionList:
    query = db.query(DBLibraryContribution)

    if decision is not None:
        query = query.filter(DBLibraryContribution.decision == decision)

    total = query.count()
    contributions = query.offset(offset).limit(limit).all()

    return LibraryContributionList(
        items=[_build_library_contribution(c) for c in contributions],
        total=total,
    )


@router.patch(
    "/api/v1/admin/library/contributions/{contributionId}/decision",
    response_model=LibraryContribution,
    summary="Admin: Review and decide on a doctor contribution",
)
def decide_library_contribution(
    payload: ContributionDecision,
    contribution_id: str = Path(alias="contributionId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> LibraryContribution:
    contribution = db.query(DBLibraryContribution).filter(
        DBLibraryContribution.id == contribution_id
    ).first()
    if contribution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library contribution not found.",
        )

    previous_decision = contribution.decision
    contribution.decision = payload.decision
    if payload.notes:
        contribution.reviewer_notes = payload.notes

    # If approved, automatically create a published LibraryEntry
    if payload.decision == "approved" and previous_decision != "approved":
        published_entry = DBLibraryEntry(
            title=contribution.title,
            summary=contribution.summary,
            content=contribution.content,
            category=contribution.category,
            source_references=contribution.source_references,
            is_published=True,
        )
        db.add(published_entry)

    audit = AuditHistory(
        actor_id=user["sub"],
        action="LIBRARY_CONTRIBUTION_DECISION",
        target_entity="LibraryContribution",
        target_id=contribution.id,
        details={
            "previous_decision": previous_decision,
            "new_decision": payload.decision,
            "notes": payload.notes,
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(contribution)
    return _build_library_contribution(contribution)
