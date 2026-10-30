from datetime import datetime
import re
from typing import List, Literal, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from databases.session import get_db
from databases.schema.models import FranchiseEnquiry

router = APIRouter(tags=["franchise"])

PINCODE_PATTERN = re.compile(r"^[1-9][0-9]{5}$")

# --- Schemas ---

class FranchiseEnquirySubmission(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200, description="Full name of the applicant")
    mobile: str = Field(..., min_length=10, max_length=50, description="Contact mobile number")
    email: Optional[str] = Field(None, max_length=320, description="Optional contact email")
    territory_pincode: str = Field(..., min_length=6, max_length=10, description="6-digit Indian PIN code")
    interested_tier: str = Field(
        ...,
        max_length=100,
        description="State Cluster Head, Zone Cluster Franchisee, or Territory Cluster Franchisee"
    )
    message: Optional[str] = Field(None, max_length=2000, description="Optional details about network/experience")


class FranchiseEnquiryRecord(BaseModel):
    id: str
    full_name: str
    mobile: str
    email: Optional[str] = None
    territory_pincode: str
    interested_tier: str
    message: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: str
    updated_at: str


class FranchiseEnquiryStats(BaseModel):
    total: int
    new_count: int
    under_review: int
    contacted: int
    approved: int


class FranchiseEnquiryListResponse(BaseModel):
    items: List[FranchiseEnquiryRecord]
    total: int
    stats: FranchiseEnquiryStats


class StatusUpdateRequest(BaseModel):
    status: Literal["New", "Under Review", "Contacted", "Approved", "Rejected"]
    admin_notes: Optional[str] = None


# --- Seed Initial Sample Enquiries if Table Empty ---

SAMPLE_ENQUIRIES = [
    {
        "full_name": "Ramesh Kumar Sharma",
        "mobile": "+91 98765 43210",
        "email": "ramesh.sharma@vedacare-distribution.in",
        "territory_pincode": "560001",
        "interested_tier": "Zone Cluster Franchisee",
        "message": "Operate 12 Ayurvedic wellness distribution centers in Bengaluru Urban. Interested in leading Zone cluster fulfillment.",
        "status": "New",
    },
    {
        "full_name": "Dr. Sunita K. Nambiar",
        "mobile": "+91 94471 88203",
        "email": "sunita.nambiar@ayushclinics.org",
        "territory_pincode": "682001",
        "interested_tier": "State Cluster Head",
        "message": "Senior Ayurvedic clinical coordinator with extensive network across Ernakulam & Central Kerala district councils.",
        "status": "Under Review",
    },
    {
        "full_name": "Vikramaditya Deshmukh",
        "mobile": "+91 98220 55194",
        "email": "v.deshmukh@westernpharma.co.in",
        "territory_pincode": "411004",
        "interested_tier": "Territory Cluster Franchisee",
        "message": "Established retail network supplying classical AYUSH formulations across Pune district and suburban clusters.",
        "status": "Contacted",
    },
    {
        "full_name": "Dr. T. Muruganandham",
        "mobile": "+91 94440 33812",
        "email": "muruganandham.bsms@siddhahealth.org",
        "territory_pincode": "600001",
        "interested_tier": "Zone Cluster Franchisee",
        "message": "Head of Chennai Siddha & Herbal Consortium. Seeking dedicated Chennai North exclusive cluster license.",
        "status": "Approved",
    },
]


def _ensure_initial_seeds(db: Session):
    count = db.query(FranchiseEnquiry).count()
    if count == 0:
        for s in SAMPLE_ENQUIRIES:
            enq = FranchiseEnquiry(
                id=f"FR-ENQ-{uuid.uuid4().hex[:8].upper()}",
                full_name=s["full_name"],
                mobile=s["mobile"],
                email=s["email"],
                territory_pincode=s["territory_pincode"],
                interested_tier=s["interested_tier"],
                message=s["message"],
                status=s["status"],
            )
            db.add(enq)
        db.commit()


# --- Public Submission Endpoint ---

@router.post(
    "/enquiry",
    response_model=FranchiseEnquiryRecord,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Franchise Expression of Interest",
    description="Public endpoint to submit an application for an exclusive district cluster franchise.",
)
def submit_franchise_enquiry(
    payload: FranchiseEnquirySubmission,
    db: Session = Depends(get_db),
) -> FranchiseEnquiryRecord:
    # Validate PIN code
    clean_pin = payload.territory_pincode.strip()
    if not PINCODE_PATTERN.match(clean_pin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN code incorrect.",
        )

    # Validate phone
    clean_mobile = payload.mobile.strip()
    digits_only = re.sub(r"\D", "", clean_mobile)
    if len(digits_only) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid 10-digit mobile number.",
        )

    # Create record
    enquiry_id = f"FR-ENQ-{uuid.uuid4().hex[:8].upper()}"
    record = FranchiseEnquiry(
        id=enquiry_id,
        full_name=payload.full_name.strip(),
        mobile=clean_mobile,
        email=payload.email.strip() if payload.email and payload.email.strip() else None,
        territory_pincode=clean_pin,
        interested_tier=payload.interested_tier.strip(),
        message=payload.message.strip() if payload.message and payload.message.strip() else None,
        status="New",
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return FranchiseEnquiryRecord(
        id=record.id,
        full_name=record.full_name,
        mobile=record.mobile,
        email=record.email,
        territory_pincode=record.territory_pincode,
        interested_tier=record.interested_tier,
        message=record.message,
        status=record.status,
        admin_notes=record.admin_notes,
        created_at=record.created_at.isoformat() if record.created_at else datetime.utcnow().isoformat(),
        updated_at=record.updated_at.isoformat() if record.updated_at else datetime.utcnow().isoformat(),
    )


# --- Admin Retrieval & Management Endpoints ---

@router.get(
    "/admin/enquiries",
    response_model=FranchiseEnquiryListResponse,
    summary="List Franchise Enquiries for Admin Dashboard",
    description="Retrieve all franchise applicant enquiries with filtering by status, search, and summary stats.",
)
@router.get(
    "/enquiries",
    response_model=FranchiseEnquiryListResponse,
)
def list_franchise_enquiries(
    q: Optional[str] = Query(None, description="Search by name, email, mobile, or PIN"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by enquiry status"),
    tier_filter: Optional[str] = Query(None, alias="tier", description="Filter by franchise tier"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> FranchiseEnquiryListResponse:
    _ensure_initial_seeds(db)

    query = db.query(FranchiseEnquiry)

    if status_filter and status_filter != "All":
        query = query.filter(FranchiseEnquiry.status == status_filter)

    if tier_filter and tier_filter != "All":
        query = query.filter(FranchiseEnquiry.interested_tier == tier_filter)

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(FranchiseEnquiry.full_name).like(term),
                func.lower(FranchiseEnquiry.mobile).like(term),
                func.lower(FranchiseEnquiry.email).like(term),
                func.lower(FranchiseEnquiry.territory_pincode).like(term),
                func.lower(FranchiseEnquiry.interested_tier).like(term),
                func.lower(FranchiseEnquiry.message).like(term),
            )
        )

    total = query.count()
    items = query.order_by(FranchiseEnquiry.created_at.desc()).offset(offset).limit(limit).all()

    # Calculate overall stats
    all_records = db.query(FranchiseEnquiry).all()
    stats = FranchiseEnquiryStats(
        total=len(all_records),
        new_count=sum(1 for r in all_records if r.status == "New"),
        under_review=sum(1 for r in all_records if r.status == "Under Review"),
        contacted=sum(1 for r in all_records if r.status == "Contacted"),
        approved=sum(1 for r in all_records if r.status == "Approved"),
    )

    records = [
        FranchiseEnquiryRecord(
            id=r.id,
            full_name=r.full_name,
            mobile=r.mobile,
            email=r.email,
            territory_pincode=r.territory_pincode,
            interested_tier=r.interested_tier,
            message=r.message,
            status=r.status,
            admin_notes=r.admin_notes,
            created_at=r.created_at.isoformat() if r.created_at else datetime.utcnow().isoformat(),
            updated_at=r.updated_at.isoformat() if r.updated_at else datetime.utcnow().isoformat(),
        )
        for r in items
    ]

    return FranchiseEnquiryListResponse(items=records, total=total, stats=stats)


@router.patch(
    "/admin/enquiries/{enquiry_id}/status",
    response_model=FranchiseEnquiryRecord,
    summary="Update Franchise Enquiry Status",
)
def update_enquiry_status(
    enquiry_id: str,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
) -> FranchiseEnquiryRecord:
    enq = db.query(FranchiseEnquiry).filter(FranchiseEnquiry.id == enquiry_id).first()
    if not enq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Franchise enquiry not found.",
        )

    enq.status = payload.status
    if payload.admin_notes is not None:
        enq.admin_notes = payload.admin_notes.strip()

    db.commit()
    db.refresh(enq)

    return FranchiseEnquiryRecord(
        id=enq.id,
        full_name=enq.full_name,
        mobile=enq.mobile,
        email=enq.email,
        territory_pincode=enq.territory_pincode,
        interested_tier=enq.interested_tier,
        message=enq.message,
        status=enq.status,
        admin_notes=enq.admin_notes,
        created_at=enq.created_at.isoformat() if enq.created_at else datetime.utcnow().isoformat(),
        updated_at=enq.updated_at.isoformat() if enq.updated_at else datetime.utcnow().isoformat(),
    )


@router.delete(
    "/admin/enquiries/{enquiry_id}",
    summary="Delete Franchise Enquiry",
)
def delete_enquiry(
    enquiry_id: str,
    db: Session = Depends(get_db),
):
    enq = db.query(FranchiseEnquiry).filter(FranchiseEnquiry.id == enquiry_id).first()
    if not enq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Franchise enquiry not found.",
        )
    db.delete(enq)
    db.commit()
    return {"message": "Franchise enquiry deleted successfully", "id": enquiry_id}

