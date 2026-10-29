import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from databases.session import Base
from databases.schema.models import User, Doctor, Manufacturer, AuditHistory


# Use an in-memory SQLite database for isolated test execution
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_create_user_and_doctor_relationship(db_session):
    user = User(
        email="doctor@meyveda.com",
        hashed_password="securehashedpassword123",
        role="doctor",
        status="active",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    doctor = Doctor(
        user_id=user.id,
        full_name="Dr. Jane Smith",
        medical_license_number="LIC-123456",
        specialty="Ayurvedic Medicine",
        verification_status="pending",
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(doctor)

    assert doctor.user.email == "doctor@meyveda.com"
    assert user.doctor_profile.medical_license_number == "LIC-123456"
    assert user.doctor_profile.verification_status == "pending"


def test_user_email_unique_constraint(db_session):
    user1 = User(
        email="unique@meyveda.com",
        hashed_password="pw1",
        role="admin",
        status="active",
    )
    db_session.add(user1)
    db_session.commit()

    user2 = User(
        email="unique@meyveda.com",
        hashed_password="pw2",
        role="manufacturer",
        status="active",
    )
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_create_manufacturer_and_audit_history(db_session):
    user = User(
        email="mfg@pharma.com",
        hashed_password="hashedsecretpwd",
        role="manufacturer",
        status="active",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    mfg = Manufacturer(
        user_id=user.id,
        company_name="Herbal Corp",
        contact_name="John Doe",
        contact_email="contact@herbalcorp.com",
        verification_status="approved",
    )
    db_session.add(mfg)

    audit = AuditHistory(
        actor_id=user.id,
        action="CREATE_MANUFACTURER_PROFILE",
        target_entity="Manufacturer",
        target_id=mfg.id,
        details={"company_name": "Herbal Corp"},
    )
    db_session.add(audit)
    db_session.commit()

    assert user.manufacturer_profile.company_name == "Herbal Corp"
    assert len(user.audit_logs) == 1
    assert user.audit_logs[0].action == "CREATE_MANUFACTURER_PROFILE"
