import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, Integer, DateTime, Date, Enum, ForeignKey, Text, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from databases.session import Base

# Enums
UserRoleEnum = Enum("doctor", "manufacturer", "admin", name="user_role")
UserStatusEnum = Enum("active", "pending", "suspended", "inactive", name="user_status")
VerificationStatusEnum = Enum("pending", "approved", "rejected", name="verification_status")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(UserRoleEnum, nullable=False, index=True)
    status: Mapped[str] = mapped_column(UserStatusEnum, default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    doctor_profile: Mapped["Doctor | None"] = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    manufacturer_profile: Mapped["Manufacturer | None"] = relationship("Manufacturer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    audit_logs: Mapped[list["AuditHistory"]] = relationship("AuditHistory", back_populates="actor", cascade="all, delete-orphan")


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    medical_license_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    qualification: Mapped[str | None] = mapped_column(String(50), default="BAMS", nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    specialty: Mapped[str] = mapped_column(String(200), nullable=False)
    invite_code: Mapped[str | None] = mapped_column(String(10), unique=True, index=True, nullable=True)
    referred_by_invite_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    verification_status: Mapped[str] = mapped_column(VerificationStatusEnum, default="pending", nullable=False, index=True)
    admin_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="doctor_profile")
    certifications: Mapped[list["DoctorCertification"]] = relationship(
        "DoctorCertification", back_populates="doctor", cascade="all, delete-orphan"
    )


class DoctorCertification(Base):
    __tablename__ = "doctor_certifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    certification_name: Mapped[str] = mapped_column(String(200), nullable=False)
    issuing_organization: Mapped[str] = mapped_column(String(200), nullable=False)
    issue_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expiration_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    evidence_reference: Mapped[str] = mapped_column(String(2000), nullable=False)
    verification_status: Mapped[str] = mapped_column(
        VerificationStatusEnum, default="pending", nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="certifications")


class Manufacturer(Base):
    __tablename__ = "manufacturers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    verification_status: Mapped[str] = mapped_column(VerificationStatusEnum, default="pending", nullable=False, index=True)
    admin_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="manufacturer_profile")
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="manufacturer", cascade="all, delete-orphan"
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    manufacturer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("manufacturers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    price: Mapped[float] = mapped_column(nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    approval_status: Mapped[str] = mapped_column(
        VerificationStatusEnum, default="pending", nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)
    admin_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    manufacturer: Mapped["Manufacturer"] = relationship("Manufacturer", back_populates="products")


class LibraryEntry(Base):
    __tablename__ = "library_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(String(2000), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    source_references: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    is_published: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


# Enum for Contribution decision: pending, approved, rejected, returned
ContributionDecisionEnum = Enum("pending", "approved", "rejected", "returned", name="contribution_decision")


class LibraryContribution(Base):
    __tablename__ = "library_contributions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    summary: Mapped[str] = mapped_column(String(2000), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    source_references: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    decision: Mapped[str] = mapped_column(
        ContributionDecisionEnum, default="pending", nullable=False, index=True
    )
    reviewer_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    doctor: Mapped["Doctor"] = relationship("Doctor")


IngestionStatusEnum = Enum("queued", "running", "completed", "failed", name="ingestion_status")


class Journal(Base):
    __tablename__ = "journals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    authors: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    journal_name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    publication_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    doi: Mapped[str | None] = mapped_column(String(200), unique=True, index=True, nullable=True)
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    abstract: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), default="Pharmacology", nullable=True, index=True)
    provider: Mapped[str | None] = mapped_column(String(100), default="PubMed / PMC", nullable=True, index=True)
    open_access: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class JournalIngestionRun(Base):
    __tablename__ = "journal_ingestion_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    query: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(IngestionStatusEnum, default="queued", nullable=False, index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    records_fetched: Mapped[int] = mapped_column(default=0, nullable=False)
    records_created: Mapped[int] = mapped_column(default=0, nullable=False)
    records_updated: Mapped[int] = mapped_column(default=0, nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


ResearchSubmissionTypeEnum = Enum(
    "formulation", "medical_details", "case_study", name="research_submission_type"
)
ResearchSubmissionStatusEnum = Enum(
    "submitted", "under_review", "approved", "rejected", "returned", name="research_submission_status"
)


class ResearchSubmission(Base):
    __tablename__ = "research_submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    submission_type: Mapped[str] = mapped_column(ResearchSubmissionTypeEnum, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(String(2000), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    attachments: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(
        ResearchSubmissionStatusEnum, default="submitted", nullable=False, index=True
    )
    reviewer_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    doctor: Mapped["Doctor"] = relationship("Doctor")


FeedbackCategoryEnum = Enum(
    "product", "service", "website", "other", name="feedback_category"
)
FeedbackStatusEnum = Enum(
    "new", "in_review", "resolved", "dismissed", name="feedback_status"
)


class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(FeedbackCategoryEnum, nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(FeedbackStatusEnum, default="new", nullable=False, index=True)
    admin_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    doctor: Mapped["Doctor"] = relationship("Doctor")


AdrOutcomeEnum = Enum(
    "recovered", "recovering", "not_recovered", "fatal", "unknown", name="adr_outcome"
)
AdrSeriousnessEnum = Enum(
    "non_serious", "serious", "life_threatening", "fatal", name="adr_seriousness"
)
AdrStatusEnum = Enum(
    "submitted", "under_review", "closed", name="adr_status"
)


class AdrReport(Base):
    __tablename__ = "adr_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_name: Mapped[str] = mapped_column(String(300), nullable=False)
    reaction: Mapped[str] = mapped_column(String(2000), nullable=False)
    occurred_on: Mapped[date] = mapped_column(Date, nullable=False)
    outcome: Mapped[str] = mapped_column(AdrOutcomeEnum, nullable=False)
    seriousness: Mapped[str] = mapped_column(AdrSeriousnessEnum, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(AdrStatusEnum, default="submitted", nullable=False, index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    doctor: Mapped["Doctor"] = relationship("Doctor")
    product: Mapped["Product"] = relationship("Product")


ReferralStatusEnum = Enum(
    "submitted", "accepted", "completed", "declined", name="referral_status"
)


class Referral(Base):
    __tablename__ = "referrals"
    __table_args__ = (
        UniqueConstraint("referring_doctor_id", "referred_contact", name="uq_doctor_referred_contact"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    referring_doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    referred_name: Mapped[str] = mapped_column(String(200), nullable=False)
    referred_contact: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(String(2000), nullable=False)
    status: Mapped[str] = mapped_column(ReferralStatusEnum, default="submitted", nullable=False, index=True)
    score_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    referring_doctor: Mapped["Doctor"] = relationship("Doctor")


class AuditHistory(Base):
    __tablename__ = "audit_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_entity: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    # Relationships
    actor: Mapped["User | None"] = relationship("User", back_populates="audit_logs")
