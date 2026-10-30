import re
from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from databases.session import get_db
from databases.schema.models import PublicRelation, BlogPost, AuditHistory
from app.auth import require_roles, UserClaims

router = APIRouter(tags=["content"])


def slugify(text: str) -> str:
    """Generate a clean URL slug from title."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text[:280] or "untitled"


# -----------------------------------------------------------------------------
# Pydantic Schemas for Public Relations
# -----------------------------------------------------------------------------

class PRCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    slug: Optional[str] = None
    summary: str = Field(..., min_length=10)
    content: str = Field(..., min_length=20)
    media_source: str = Field(default="Meyveda Media Desk", max_length=150)
    media_source_url: Optional[str] = None
    category: str = Field(default="Press Release", max_length=100)
    cover_image_url: Optional[str] = None
    published_date: Optional[date] = None
    is_featured: bool = False
    status: str = Field(default="published", max_length=50)


class PRUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=300)
    slug: Optional[str] = None
    summary: Optional[str] = Field(None, min_length=10)
    content: Optional[str] = Field(None, min_length=20)
    media_source: Optional[str] = Field(None, max_length=150)
    media_source_url: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    cover_image_url: Optional[str] = None
    published_date: Optional[date] = None
    is_featured: Optional[bool] = None
    status: Optional[str] = Field(None, max_length=50)


class PRResponse(BaseModel):
    id: str
    title: str
    slug: str
    summary: str
    content: str
    media_source: str
    media_source_url: Optional[str] = None
    category: str
    cover_image_url: Optional[str] = None
    published_date: date
    is_featured: bool
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# Pydantic Schemas for Blog Posts
# -----------------------------------------------------------------------------

class BlogCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    slug: Optional[str] = None
    summary: str = Field(..., min_length=10)
    content: str = Field(..., min_length=20)
    author_name: str = Field(default="Meyveda Clinical Desk", max_length=200)
    author_role: str = Field(default="AYUSH Clinical Research", max_length=200)
    category: str = Field(default="Clinical Practice", max_length=100)
    cover_image_url: Optional[str] = None
    reading_time: str = Field(default="5 min read", max_length=50)
    tags: Optional[list[str]] = None
    is_featured: bool = False
    status: str = Field(default="published", max_length=50)


class BlogUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=300)
    slug: Optional[str] = None
    summary: Optional[str] = Field(None, min_length=10)
    content: Optional[str] = Field(None, min_length=20)
    author_name: Optional[str] = Field(None, max_length=200)
    author_role: Optional[str] = Field(None, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    cover_image_url: Optional[str] = None
    reading_time: Optional[str] = Field(None, max_length=50)
    tags: Optional[list[str]] = None
    is_featured: Optional[bool] = None
    status: Optional[str] = Field(None, max_length=50)


class BlogResponse(BaseModel):
    id: str
    title: str
    slug: str
    summary: str
    content: str
    author_name: str
    author_role: str
    category: str
    cover_image_url: Optional[str] = None
    reading_time: str
    tags: Optional[list[str]] = None
    is_featured: bool
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# Public Read Endpoints: Public Relations
# -----------------------------------------------------------------------------

@router.get("/pr", response_model=list[PRResponse], summary="List published PR articles")
def list_public_relations(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by title or summary"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(PublicRelation).filter(PublicRelation.status == "published")
    if category and category.lower() != "all":
        query = query.filter(PublicRelation.category.ilike(category.strip()))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                PublicRelation.title.ilike(term),
                PublicRelation.summary.ilike(term),
                PublicRelation.content.ilike(term),
                PublicRelation.media_source.ilike(term),
            )
        )
    return (
        query.order_by(
            desc(PublicRelation.is_featured),
            desc(PublicRelation.published_date),
            desc(PublicRelation.created_at),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/pr/{identifier}", response_model=PRResponse, summary="Get single PR article by slug or ID")
def get_public_relation(identifier: str, db: Session = Depends(get_db)):
    pr = (
        db.query(PublicRelation)
        .filter(
            or_(PublicRelation.slug == identifier, PublicRelation.id == identifier),
            PublicRelation.status == "published",
        )
        .first()
    )
    if not pr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public relation article not found or not published",
        )
    return pr


# -----------------------------------------------------------------------------
# Public Read Endpoints: Blogs
# -----------------------------------------------------------------------------

@router.get("/blogs", response_model=list[BlogResponse], summary="List published blog posts")
def list_blogs(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by title or summary"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(BlogPost).filter(BlogPost.status == "published")
    if category and category.lower() != "all":
        query = query.filter(BlogPost.category.ilike(category.strip()))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                BlogPost.title.ilike(term),
                BlogPost.summary.ilike(term),
                BlogPost.content.ilike(term),
                BlogPost.author_name.ilike(term),
            )
        )
    return (
        query.order_by(
            desc(BlogPost.is_featured),
            desc(BlogPost.created_at),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/blogs/{identifier}", response_model=BlogResponse, summary="Get single blog post by slug or ID")
def get_blog(identifier: str, db: Session = Depends(get_db)):
    blog = (
        db.query(BlogPost)
        .filter(
            or_(BlogPost.slug == identifier, BlogPost.id == identifier),
            BlogPost.status == "published",
        )
        .first()
    )
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found or not published",
        )
    return blog


# -----------------------------------------------------------------------------
# Content Management Desk (Restricted to content_manager and admin)
# -----------------------------------------------------------------------------

@router.get("/manage/all", summary="Get all PR articles, blogs, and metrics for Content Manager")
def get_content_manager_overview(
    db: Session = Depends(get_db),
    claims: UserClaims = Depends(require_roles("content_manager", "admin")),
):
    prs = db.query(PublicRelation).order_by(desc(PublicRelation.created_at)).all()
    blogs = db.query(BlogPost).order_by(desc(BlogPost.created_at)).all()

    total_pr = len(prs)
    total_blogs = len(blogs)
    pr_published = sum(1 for p in prs if p.status == "published")
    blog_published = sum(1 for b in blogs if b.status == "published")

    return {
        "metrics": {
            "total_pr": total_pr,
            "total_blogs": total_blogs,
            "total_items": total_pr + total_blogs,
            "published_count": pr_published + blog_published,
            "draft_count": (total_pr - pr_published) + (total_blogs - blog_published),
        },
        "prs": [PRResponse.model_validate(p) for p in prs],
        "blogs": [BlogResponse.model_validate(b) for b in blogs],
    }


# --- PR CRUD ---

@router.post("/pr", response_model=PRResponse, status_code=status.HTTP_201_CREATED, summary="Create PR article")
def create_pr(
    payload: PRCreateRequest,
    db: Session = Depends(get_db),
    claims: UserClaims = Depends(require_roles("content_manager", "admin")),
):
    base_slug = slugify(payload.slug or payload.title)
    final_slug = base_slug
    idx = 1
    while db.query(PublicRelation).filter(PublicRelation.slug == final_slug).first():
        final_slug = f"{base_slug}-{idx}"
        idx += 1

    item = PublicRelation(
        title=payload.title.strip(),
        slug=final_slug,
        summary=payload.summary.strip(),
        content=payload.content.strip(),
        media_source=payload.media_source.strip(),
        media_source_url=payload.media_source_url.strip() if payload.media_source_url else None,
        category=payload.category.strip(),
        cover_image_url=payload.cover_image_url.strip() if payload.cover_image_url else None,
        published_date=payload.published_date or date.today(),
        is_featured=payload.is_featured,
        status=payload.status.strip().lower(),
    )
    db.add(item)
    db.flush()

    audit = AuditHistory(
        actor_id=claims["sub"],
        action="CONTENT_CREATE_PR",
        target_entity="PublicRelation",
        target_id=item.id,
        details={"title": item.title, "slug": item.slug, "status": item.status},
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item


@router.put("/pr/{id}", response_model=PRResponse, summary="Update PR article")
def update_pr(
    id: str,
    payload: PRUpdateRequest,
    db: Session = Depends(get_db),
    claims: UserClaims = Depends(require_roles("content_manager", "admin")),
):
    item = db.query(PublicRelation).filter(PublicRelation.id == id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PR article not found")

    if payload.title is not None:
        item.title = payload.title.strip()
    if payload.slug is not None and payload.slug.strip():
        new_slug = slugify(payload.slug)
        existing = db.query(PublicRelation).filter(PublicRelation.slug == new_slug, PublicRelation.id != id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already in use")
        item.slug = new_slug
    if payload.summary is not None:
        item.summary = payload.summary.strip()
    if payload.content is not None:
        item.content = payload.content.strip()
    if payload.media_source is not None:
        item.media_source = payload.media_source.strip()
    if payload.media_source_url is not None:
        item.media_source_url = payload.media_source_url.strip() or None
    if payload.category is not None:
        item.category = payload.category.strip()
    if payload.cover_image_url is not None:
        item.cover_image_url = payload.cover_image_url.strip() or None
    if payload.published_date is not None:
        item.published_date = payload.published_date
    if payload.is_featured is not None:
        item.is_featured = payload.is_featured
    if payload.status is not None:
        item.status = payload.status.strip().lower()

    item.updated_at = datetime.now(timezone.utc)

    audit = AuditHistory(
        actor_id=claims["sub"],
        action="CONTENT_UPDATE_PR",
        target_entity="PublicRelation",
        target_id=item.id,
        details={"title": item.title, "status": item.status},
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/pr/{id}", status_code=status.HTTP_200_OK, summary="Delete PR article")
def delete_pr(
    id: str,
    db: Session = Depends(get_db),
    claims: UserClaims = Depends(require_roles("content_manager", "admin")),
):
    item = db.query(PublicRelation).filter(PublicRelation.id == id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PR article not found")

    audit = AuditHistory(
        actor_id=claims["sub"],
        action="CONTENT_DELETE_PR",
        target_entity="PublicRelation",
        target_id=item.id,
        details={"title": item.title},
    )
    db.add(audit)
    db.delete(item)
    db.commit()
    return {"message": "PR article successfully deleted", "id": id}


# --- Blog CRUD ---

@router.post("/blogs", response_model=BlogResponse, status_code=status.HTTP_201_CREATED, summary="Create blog post")
def create_blog(
    payload: BlogCreateRequest,
    db: Session = Depends(get_db),
    claims: UserClaims = Depends(require_roles("content_manager", "admin")),
):
    base_slug = slugify(payload.slug or payload.title)
    final_slug = base_slug
    idx = 1
    while db.query(BlogPost).filter(BlogPost.slug == final_slug).first():
        final_slug = f"{base_slug}-{idx}"
        idx += 1

    item = BlogPost(
        title=payload.title.strip(),
        slug=final_slug,
        summary=payload.summary.strip(),
        content=payload.content.strip(),
        author_name=payload.author_name.strip(),
        author_role=payload.author_role.strip(),
        category=payload.category.strip(),
        cover_image_url=payload.cover_image_url.strip() if payload.cover_image_url else None,
        reading_time=payload.reading_time.strip(),
        tags=payload.tags or [],
        is_featured=payload.is_featured,
        status=payload.status.strip().lower(),
    )
    db.add(item)
    db.flush()

    audit = AuditHistory(
        actor_id=claims["sub"],
        action="CONTENT_CREATE_BLOG",
        target_entity="BlogPost",
        target_id=item.id,
        details={"title": item.title, "slug": item.slug, "status": item.status},
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item


@router.put("/blogs/{id}", response_model=BlogResponse, summary="Update blog post")
def update_blog(
    id: str,
    payload: BlogUpdateRequest,
    db: Session = Depends(get_db),
    claims: UserClaims = Depends(require_roles("content_manager", "admin")),
):
    item = db.query(BlogPost).filter(BlogPost.id == id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")

    if payload.title is not None:
        item.title = payload.title.strip()
    if payload.slug is not None and payload.slug.strip():
        new_slug = slugify(payload.slug)
        existing = db.query(BlogPost).filter(BlogPost.slug == new_slug, BlogPost.id != id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already in use")
        item.slug = new_slug
    if payload.summary is not None:
        item.summary = payload.summary.strip()
    if payload.content is not None:
        item.content = payload.content.strip()
    if payload.author_name is not None:
        item.author_name = payload.author_name.strip()
    if payload.author_role is not None:
        item.author_role = payload.author_role.strip()
    if payload.category is not None:
        item.category = payload.category.strip()
    if payload.cover_image_url is not None:
        item.cover_image_url = payload.cover_image_url.strip() or None
    if payload.reading_time is not None:
        item.reading_time = payload.reading_time.strip()
    if payload.tags is not None:
        item.tags = payload.tags
    if payload.is_featured is not None:
        item.is_featured = payload.is_featured
    if payload.status is not None:
        item.status = payload.status.strip().lower()

    item.updated_at = datetime.now(timezone.utc)

    audit = AuditHistory(
        actor_id=claims["sub"],
        action="CONTENT_UPDATE_BLOG",
        target_entity="BlogPost",
        target_id=item.id,
        details={"title": item.title, "status": item.status},
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/blogs/{id}", status_code=status.HTTP_200_OK, summary="Delete blog post")
def delete_blog(
    id: str,
    db: Session = Depends(get_db),
    claims: UserClaims = Depends(require_roles("content_manager", "admin")),
):
    item = db.query(BlogPost).filter(BlogPost.id == id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")

    audit = AuditHistory(
        actor_id=claims["sub"],
        action="CONTENT_DELETE_BLOG",
        target_entity="BlogPost",
        target_id=item.id,
        details={"title": item.title},
    )
    db.add(audit)
    db.delete(item)
    db.commit()
    return {"message": "Blog post successfully deleted", "id": id}
