from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth import UserClaims, require_role
from databases.session import get_db
from databases.schema.models import Journal as DBJournal, AuditHistory

router = APIRouter(tags=["journals"])


# --- Schemas ---

class JournalRecordSubmission(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    authors: list[str] = Field(default_factory=list, max_length=100)
    journal_name: str = Field(min_length=1, max_length=300)
    publication_date: date | None = None
    doi: str | None = Field(default=None, max_length=200)
    url: HttpUrl | None = None
    abstract: str | None = Field(default=None, max_length=20000)


class JournalRecordUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    authors: list[str] | None = Field(default=None, max_length=100)
    journal_name: str | None = Field(default=None, min_length=1, max_length=300)
    publication_date: date | None = None
    doi: str | None = Field(default=None, max_length=200)
    url: HttpUrl | None = None
    abstract: str | None = Field(default=None, max_length=20000)


class JournalRecord(JournalRecordSubmission):
    id: str
    category: str | None = None
    provider: str | None = None
    open_access: bool = True
    created_at: datetime
    updated_at: datetime


class JournalRecordList(BaseModel):
    items: list[JournalRecord]
    total: int


def _build_journal_record(journal: DBJournal) -> JournalRecord:
    pub_date = journal.publication_date.date() if journal.publication_date else None
    url_val = HttpUrl(journal.url) if journal.url else None
    return JournalRecord(
        id=journal.id,
        title=journal.title,
        authors=journal.authors or [],
        journal_name=journal.journal_name,
        publication_date=pub_date,
        doi=journal.doi,
        url=url_val,
        abstract=journal.abstract,
        category=getattr(journal, "category", "Pharmacology"),
        provider=getattr(journal, "provider", "PubMed / PMC"),
        open_access=getattr(journal, "open_access", True),
        created_at=journal.created_at,
        updated_at=journal.updated_at,
    )


# --- Endpoints ---

@router.get(
    "/api/v1/journals",
    response_model=JournalRecordList,
    summary="Public: Browse active journal articles",
)
@router.get(
    "/api/journals",
    response_model=JournalRecordList,
    summary="Public: Browse active journal articles (alias)",
)
def browse_journals(
    search: str | None = Query(default=None, description="Search journal title, authors, or DOI"),
    journal_name: str | None = Query(default=None, min_length=1, max_length=300),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> JournalRecordList:
    query = db.query(DBJournal).filter(DBJournal.is_active.is_(True))

    if journal_name:
        query = query.filter(DBJournal.journal_name.ilike(journal_name))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                DBJournal.title.ilike(search_filter),
                DBJournal.journal_name.ilike(search_filter),
                DBJournal.doi.ilike(search_filter),
            )
        )

    total = query.count()
    journals = query.offset(offset).limit(limit).all()

    return JournalRecordList(
        items=[_build_journal_record(j) for j in journals],
        total=total,
    )


@router.get(
    "/api/v1/journals/{journalId}",
    response_model=JournalRecord,
    summary="Public: Get active journal article details by ID",
)
def get_journal(
    journal_id: str = Path(alias="journalId"),
    db: Session = Depends(get_db),
) -> JournalRecord:
    journal = db.query(DBJournal).filter(
        DBJournal.id == journal_id,
        DBJournal.is_active.is_(True),
    ).first()

    if journal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal article not found.",
        )
    return _build_journal_record(journal)


@router.get(
    "/api/v1/admin/journals",
    response_model=JournalRecordList,
    summary="Admin: List all journal records including inactive ones",
)
def list_journals_for_admin(
    search: str | None = Query(default=None, description="Search journal title, authors, or DOI"),
    journal_name: str | None = Query(default=None, min_length=1, max_length=300),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> JournalRecordList:
    query = db.query(DBJournal)

    if journal_name:
        query = query.filter(DBJournal.journal_name.ilike(journal_name))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                DBJournal.title.ilike(search_filter),
                DBJournal.journal_name.ilike(search_filter),
                DBJournal.doi.ilike(search_filter),
            )
        )

    total = query.count()
    journals = query.offset(offset).limit(limit).all()

    return JournalRecordList(
        items=[_build_journal_record(j) for j in journals],
        total=total,
    )


@router.post(
    "/api/v1/admin/journals",
    response_model=JournalRecord,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Create a new journal article record",
)
def create_journal(
    payload: JournalRecordSubmission,
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> JournalRecord:
    # Check DOI uniqueness if provided
    if payload.doi:
        existing = db.query(DBJournal).filter(DBJournal.doi.ilike(payload.doi)).first()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A journal article with this DOI already exists.",
            )

    pub_datetime = (
        datetime.combine(payload.publication_date, datetime.min.time(), tzinfo=timezone.utc)
        if payload.publication_date
        else None
    )

    new_journal = DBJournal(
        title=payload.title,
        authors=payload.authors,
        journal_name=payload.journal_name,
        publication_date=pub_datetime,
        doi=payload.doi,
        url=str(payload.url) if payload.url else None,
        abstract=payload.abstract,
        is_active=True,
    )
    db.add(new_journal)

    audit = AuditHistory(
        actor_id=user["sub"],
        action="JOURNAL_CREATED",
        target_entity="Journal",
        target_id=new_journal.id,
        details={"title": new_journal.title, "doi": new_journal.doi},
    )
    db.add(audit)

    db.commit()
    db.refresh(new_journal)
    return _build_journal_record(new_journal)


@router.patch(
    "/api/v1/admin/journals/{journalId}",
    response_model=JournalRecord,
    summary="Admin: Update a journal article record",
)
def update_journal(
    payload: JournalRecordUpdate,
    journal_id: str = Path(alias="journalId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> JournalRecord:
    journal = db.query(DBJournal).filter(DBJournal.id == journal_id).first()
    if journal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal article not found.",
        )

    if payload.doi is not None and payload.doi != journal.doi:
        existing = db.query(DBJournal).filter(
            DBJournal.doi.ilike(payload.doi),
            DBJournal.id != journal.id,
        ).first()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another journal article with this DOI already exists.",
            )
        journal.doi = payload.doi

    if payload.title is not None:
        journal.title = payload.title
    if payload.authors is not None:
        journal.authors = payload.authors
    if payload.journal_name is not None:
        journal.journal_name = payload.journal_name
    if payload.publication_date is not None:
        journal.publication_date = datetime.combine(
            payload.publication_date, datetime.min.time(), tzinfo=timezone.utc
        )
    if payload.url is not None:
        journal.url = str(payload.url)
    if payload.abstract is not None:
        journal.abstract = payload.abstract

    audit = AuditHistory(
        actor_id=user["sub"],
        action="JOURNAL_UPDATED",
        target_entity="Journal",
        target_id=journal.id,
        details={"updated_fields": list(payload.model_dump(exclude_unset=True).keys())},
    )
    db.add(audit)

    db.commit()
    db.refresh(journal)
    return _build_journal_record(journal)


@router.delete(
    "/api/v1/admin/journals/{journalId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Admin: Safely deactivate/archive or delete a journal record",
)
def delete_journal(
    journal_id: str = Path(alias="journalId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> Response:
    journal = db.query(DBJournal).filter(DBJournal.id == journal_id).first()
    if journal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal article not found.",
        )

    # Safe deactivation/archival to preserve historical citations and reference integrity
    journal.is_active = False

    audit = AuditHistory(
        actor_id=user["sub"],
        action="JOURNAL_DEACTIVATED",
        target_entity="Journal",
        target_id=journal.id,
        details={"title": journal.title, "doi": journal.doi},
    )
    db.add(audit)

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
