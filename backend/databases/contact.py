from datetime import datetime, timezone
import re
from typing import List, Literal, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from databases.session import get_db
from databases.schema.models import ContactMessage

router = APIRouter(tags=["contact"])

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_CLEAN_PATTERN = re.compile(r"[^0-9+]")

# --- Schemas ---

class ContactSubmission(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200, description="Full name of person submitting")
    email: str = Field(..., min_length=5, max_length=320, description="Contact email address")
    phone: str = Field(..., min_length=10, max_length=50, description="Contact phone or mobile number")
    category: str = Field(
        default="General Inquiry",
        max_length=100,
        description="Doctor Onboarding, Cluster Franchise, Pharma Collaboration, Technical Support, etc."
    )
    subject: str = Field(..., min_length=3, max_length=250, description="Brief subject of inquiry")
    message: str = Field(..., min_length=10, max_length=3000, description="Detailed message body")


class ContactMessageRecord(BaseModel):
    id: str
    reference_code: str
    full_name: str
    email: str
    phone: str
    category: str
    subject: str
    message: str
    status: str
    admin_notes: Optional[str] = None
    created_at: str
    updated_at: str


class ContactStats(BaseModel):
    total: int
    new_count: int
    in_progress_count: int
    contacted_count: int
    resolved_count: int


class ContactListResponse(BaseModel):
    items: List[ContactMessageRecord]
    total: int
    stats: ContactStats


class ContactStatusUpdateRequest(BaseModel):
    status: Literal["New", "In Progress", "Contacted", "Resolved", "Archived"]
    admin_notes: Optional[str] = None


# --- Seed Initial Sample Enquiries if Table Empty ---

SAMPLE_MESSAGES = [
    {
        "full_name": "Dr. A. V. Vaidyanathan",
        "email": "vaidyanathan.ayur@keralaclinics.org",
        "phone": "+91 94472 11984",
        "category": "Doctor Onboarding & Verification",
        "subject": "Kerala State AYUSH Council Registration Pre-check",
        "message": "Namaste. I am a BAMS practitioner with 14 years clinical experience in Kozhikode. I would like to verify if my Kerala State council registration credentials can be expedited for early access cohort verification.",
        "status": "New",
        "admin_notes": "Pending State AYUSH Council verification lookup."
    },
    {
        "full_name": "Siddharth Verma",
        "email": "siddharth.verma@ayurherbalpack.in",
        "phone": "+91 98110 44230",
        "category": "AYUSH Pharma Collaboration",
        "subject": "Classical Formulations Listing & Quality Monographs",
        "message": "We manufacture GMP-certified Kashayams, Asavas, and Vatis in Haridwar. We are keen to list our batch certificates of analysis (CoA) and heavy metal testing reports in the Meyveda Medicine Catalogue.",
        "status": "In Progress",
        "admin_notes": "Sent technical compliance packet and monograph guidelines."
    },
    {
        "full_name": "Dr. Prerna Deshmukh",
        "email": "prerna.deshmukh@wellnessayush.in",
        "phone": "+91 98230 77125",
        "category": "Cluster Franchise Network",
        "subject": "District Franchise Fulfillment Query for Pune Rural",
        "message": "Interested in establishing a dedicated Ayurvedic co-working clinic and supply cluster across Pune district. Would like to understand the territory radius and inventory integration with Meyveda platform.",
        "status": "Contacted",
        "admin_notes": "Spoke over phone on Oct 29. Shared territory MOU draft."
    },
    {
        "full_name": "Dr. Rajeshwar Iyer",
        "email": "dr.iyer.bams@gmail.com",
        "phone": "+91 99863 12450",
        "category": "Research & Journal Publications",
        "subject": "Submission of Case Series on Amavata Classical Protocol",
        "message": "We have documented 45 clinical cases of Amavata managed with classical Virechana and Shunthi-Guduchi kwatha. How can our clinical team submit this peer-reviewed dossier to the Meyveda Journals index?",
        "status": "Resolved",
        "admin_notes": "Guidance provided. Directed to /workspace/journals submission portal."
    }
]


def ensure_seed_messages(db: Session):
    try:
        count = db.query(ContactMessage).count()
        if count == 0:
            for s in SAMPLE_MESSAGES:
                msg = ContactMessage(
                    id=str(uuid.uuid4()),
                    full_name=s["full_name"],
                    email=s["email"],
                    phone=s["phone"],
                    category=s["category"],
                    subject=s["subject"],
                    message=s["message"],
                    status=s["status"],
                    admin_notes=s.get("admin_notes"),
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
                db.add(msg)
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Contact] Warning during seed check: {e}")


def format_record(item: ContactMessage) -> ContactMessageRecord:
    # Build clean human-friendly reference code from id prefix
    ref_code = f"MV-CT-{item.id[:8].upper()}"
    return ContactMessageRecord(
        id=item.id,
        reference_code=ref_code,
        full_name=item.full_name,
        email=item.email,
        phone=item.phone,
        category=item.category,
        subject=item.subject,
        message=item.message,
        status=item.status,
        admin_notes=item.admin_notes,
        created_at=item.created_at.isoformat() if item.created_at else "",
        updated_at=item.updated_at.isoformat() if item.updated_at else "",
    )


# --- Public Submission Endpoint ---

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Submit a contact enquiry",
    description="Public endpoint to submit general inquiries, doctor onboarding questions, or partner inquiries."
)
def submit_contact_message(payload: ContactSubmission, db: Session = Depends(get_db)):
    # 1. Clean & Validate Full Name
    clean_name = payload.full_name.strip()
    if len(clean_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name must be at least 2 characters."
        )

    # 2. Validate Email
    clean_email = payload.email.strip().lower()
    if not EMAIL_PATTERN.match(clean_email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid email address (e.g. name@domain.com)."
        )
    parts = clean_email.split("@")
    if len(parts) == 2:
        local_part, domain = parts
        domain_parts = domain.split(".")
        tld = domain_parts[-1]
        if len(tld) < 2 or not tld.isalpha():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Email address must have a valid domain extension."
            )
        alpha_chars = "".join([c for c in local_part if c.isalpha()])
        if len(alpha_chars) >= 5 and sum(1 for c in alpha_chars if c in "aeiouy") == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Please provide a valid, deliverable email address (avoid keyboard mashing)."
            )
        if re.search(r"[bcdfghjklmnpqrstvwxz]{6,}", local_part, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Please provide a valid email address (unusual consonant sequence detected)."
            )

    # 3. Clean & Validate Phone Number
    digits = re.sub(r"[^0-9]", "", payload.phone)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]

    if len(digits) != 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Please enter a valid 10-digit mobile number (received {len(digits)} digits)."
        )
    if digits[0] not in "6789":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Indian mobile numbers must start with 6, 7, 8, or 9."
        )
    if len(set(digits)) == 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Mobile number cannot consist of identical repeated digits."
        )
    clean_phone = f"+91 {digits[:5]} {digits[5:]}"

    # 4. Clean Subject & Message
    clean_subject = payload.subject.strip()
    clean_message = payload.message.strip()
    if len(clean_subject) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Subject must be at least 3 characters."
        )
    if len(clean_message) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message body must be at least 10 characters."
        )

    # 5. Save to Database
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    new_message = ContactMessage(
        id=msg_id,
        full_name=clean_name,
        email=clean_email,
        phone=clean_phone,
        category=payload.category.strip() or "General Inquiry",
        subject=clean_subject,
        message=clean_message,
        status="New",
        created_at=now,
        updated_at=now,
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    ref_code = f"MV-CT-{msg_id[:8].upper()}"

    return {
        "ok": True,
        "id": new_message.id,
        "reference_code": ref_code,
        "message": "Thank you for reaching out to Meyveda. Your inquiry has been received and our team will get in touch with you shortly.",
        "submitted_at": now.isoformat(),
    }


# --- Admin Endpoints ---

@router.get(
    "/admin/messages",
    response_model=ContactListResponse,
    summary="List contact messages (Admin)",
    description="Fetch contact messages with status filter, search query, and summary statistics."
)
def list_admin_contact_messages(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    ensure_seed_messages(db)

    query = db.query(ContactMessage)

    # Status filter
    if status_filter and status_filter.lower() != "all":
        query = query.filter(ContactMessage.status.ilike(status_filter.strip()))

    # Category filter
    if category and category.lower() != "all":
        query = query.filter(ContactMessage.category.ilike(category.strip()))

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ContactMessage.full_name.ilike(term),
                ContactMessage.email.ilike(term),
                ContactMessage.phone.ilike(term),
                ContactMessage.subject.ilike(term),
                ContactMessage.message.ilike(term),
            )
        )

    # Compute Statistics
    all_q = db.query(ContactMessage)
    total_count = all_q.count()
    new_count = all_q.filter(ContactMessage.status == "New").count()
    in_progress_count = all_q.filter(ContactMessage.status == "In Progress").count()
    contacted_count = all_q.filter(ContactMessage.status == "Contacted").count()
    resolved_count = all_q.filter(ContactMessage.status == "Resolved").count()

    total_filtered = query.count()
    records = query.order_by(ContactMessage.created_at.desc()).offset(offset).limit(limit).all()

    return ContactListResponse(
        items=[format_record(r) for r in records],
        total=total_filtered,
        stats=ContactStats(
            total=total_count,
            new_count=new_count,
            in_progress_count=in_progress_count,
            contacted_count=contacted_count,
            resolved_count=resolved_count,
        ),
    )


@router.get(
    "/admin/messages/{message_id}",
    response_model=ContactMessageRecord,
    summary="Get single contact message details"
)
def get_admin_contact_message(message_id: str, db: Session = Depends(get_db)):
    record = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact message not found.")
    return format_record(record)


@router.patch(
    "/admin/messages/{message_id}/status",
    response_model=ContactMessageRecord,
    summary="Update contact message status"
)
def update_contact_message_status(
    message_id: str,
    payload: ContactStatusUpdateRequest,
    db: Session = Depends(get_db),
):
    record = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact message not found.")

    record.status = payload.status
    if payload.admin_notes is not None:
        record.admin_notes = payload.admin_notes.strip()
    record.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(record)

    return format_record(record)

