import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config import settings
from app.auth import create_access_token, hash_password
from databases.session import Base, get_db
from databases.schema.models import (
    User,
    Doctor,
    Manufacturer,
    Product,
    ResearchSubmission,
    AdrReport,
    Feedback,
    Referral,
)

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_jwt_secret():
    settings.JWT_SECRET_KEY = "supersecretjwtkeythatisatleast32characterslong!"


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    user = User(
        email="admin.dashboards@ayurveda.org",
        hashed_password=hash_password("AdminPass123!"),
        role="admin",
        status="active",
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def doctor_user(db_session):
    user = User(
        email="doctor.dashboards@ayurveda.org",
        hashed_password=hash_password("DoctorPass123!"),
        role="doctor",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    doctor = Doctor(
        user_id=user.id,
        full_name="Dr. Dashboard Vaidya",
        medical_license_number="LIC-DASH-001",
        specialty="Panchakarma",
        verification_status="approved",
    )
    db_session.add(doctor)
    db_session.commit()
    return user, doctor


@pytest.fixture
def manufacturer_user(db_session):
    user = User(
        email="mfg.dashboards@ayurveda.org",
        hashed_password=hash_password("MfgPass123!"),
        role="manufacturer",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    mfg = Manufacturer(
        user_id=user.id,
        company_name="Dash Herbal Corp",
        contact_name="Ravi Kumar",
        contact_email="ravi@dashherbal.com",
        verification_status="approved",
    )
    db_session.add(mfg)
    db_session.commit()
    return user, mfg


def auth_header(user):
    token = create_access_token(user.id, user.role)
    return {"Authorization": f"Bearer {token}"}


def test_admin_dashboard_summary_empty_tables(client, admin_user):
    headers = auth_header(admin_user)
    resp = client.get("/api/v1/admin/dashboard/summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["registered_doctors"] == 0
    assert data["verified_doctors"] == 0
    assert data["registered_manufacturers"] == 0
    assert data["verified_manufacturers"] == 0
    assert data["approved_products"] == 0
    assert data["pending_products"] == 0
    assert data["total_products"] == 0
    assert data["total_research_submissions"] == 0
    assert data["approved_research_submissions"] == 0
    assert data["total_adr_reports"] == 0
    assert data["total_feedback"] == 0
    assert data["total_referrals"] == 0


def test_admin_dashboard_summary_with_records(
    client, admin_user, doctor_user, manufacturer_user, db_session
):
    _, doctor = doctor_user
    _, mfg = manufacturer_user

    # Add 1 approved product and 1 pending product
    p1 = Product(
        manufacturer_id=mfg.id,
        name="Herbal Tea",
        description="Relaxing blend",
        category="Beverages",
        price=10.0,
        approval_status="approved",
    )
    p2 = Product(
        manufacturer_id=mfg.id,
        name="Herbal Oil",
        description="Hair oil",
        category="Haircare",
        price=15.0,
        approval_status="pending",
    )
    db_session.add_all([p1, p2])

    # Add 1 approved research submission
    sub = ResearchSubmission(
        doctor_id=doctor.id,
        submission_type="formulation",
        title="Formulation Study on Herbal Tea",
        summary="Clinical observations",
        content="Detailed methodology and outcomes",
        status="approved",
    )
    db_session.add(sub)

    # Add 1 feedback
    fb = Feedback(
        doctor_id=doctor.id,
        category="product",
        subject="Quality note",
        message="Excellent quality",
        status="new",
    )
    db_session.add(fb)

    # Add 1 referral
    ref = Referral(
        referring_doctor_id=doctor.id,
        referred_name="Patient Roy",
        referred_contact="roy@example.com",
        reason="General consultation",
        status="submitted",
    )
    db_session.add(ref)

    db_session.commit()

    headers = auth_header(admin_user)
    resp = client.get("/api/v1/admin/dashboard/summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["registered_doctors"] == 1
    assert data["verified_doctors"] == 1
    assert data["registered_manufacturers"] == 1
    assert data["verified_manufacturers"] == 1
    assert data["approved_products"] == 1
    assert data["pending_products"] == 1
    assert data["total_products"] == 2
    assert data["total_research_submissions"] == 1
    assert data["approved_research_submissions"] == 1
    assert data["total_feedback"] == 1
    assert data["total_referrals"] == 1


def test_admin_territory_summary(client, admin_user):
    headers = auth_header(admin_user)
    resp = client.get("/api/v1/admin/territories/summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] == 0
    assert len(data["items"]) == 0


def test_dashboard_role_restrictions(client, doctor_user, manufacturer_user):
    doc_user, _ = doctor_user
    mfg_user, _ = manufacturer_user

    # Unauthenticated
    resp = client.get("/api/v1/admin/dashboard/summary")
    assert resp.status_code == 401

    resp = client.get("/api/v1/admin/territories/summary")
    assert resp.status_code == 401

    # Doctor role forbidden
    resp = client.get("/api/v1/admin/dashboard/summary", headers=auth_header(doc_user))
    assert resp.status_code == 403

    resp = client.get("/api/v1/admin/territories/summary", headers=auth_header(doc_user))
    assert resp.status_code == 403

    # Manufacturer role forbidden
    resp = client.get("/api/v1/admin/dashboard/summary", headers=auth_header(mfg_user))
    assert resp.status_code == 403

    resp = client.get("/api/v1/admin/territories/summary", headers=auth_header(mfg_user))
    assert resp.status_code == 403


def test_manufacturer_dashboard_and_feedback_summary(client, manufacturer_user, doctor_user, db_session):
    mfg_user, mfg = manufacturer_user
    doc_user, doctor = doctor_user
    headers = auth_header(mfg_user)

    # Add products for this manufacturer
    p1 = Product(
        manufacturer_id=mfg.id,
        name="Mfg Prod 1",
        description="Desc",
        category="Cat 1",
        price=10.0,
        approval_status="approved",
    )
    p2 = Product(
        manufacturer_id=mfg.id,
        name="Mfg Prod 2",
        description="Desc",
        category="Cat 2",
        price=20.0,
        approval_status="pending",
    )
    p3 = Product(
        manufacturer_id=mfg.id,
        name="Mfg Prod 3",
        description="Desc",
        category="Cat 3",
        price=30.0,
        approval_status="rejected",
    )
    db_session.add_all([p1, p2, p3])

    # Add feedback
    fb1 = Feedback(
        doctor_id=doctor.id,
        category="product",
        subject="FB 1",
        message="Msg 1",
        status="new",
    )
    fb2 = Feedback(
        doctor_id=doctor.id,
        category="service",
        subject="FB 2",
        message="Msg 2",
        status="new",
    )
    db_session.add_all([fb1, fb2])
    db_session.commit()

    # GET /api/v1/manufacturers/me/dashboard
    resp = client.get("/api/v1/manufacturers/me/dashboard", headers=headers)
    assert resp.status_code == 200
    dash_data = resp.json()
    assert dash_data["approved_products"] == 1
    assert dash_data["pending_products"] == 1
    assert dash_data["rejected_products"] == 1
    assert dash_data["doctor_feedback_count"] == 1

    # GET /api/v1/manufacturers/me/doctor-feedback-summary
    fb_resp = client.get("/api/v1/manufacturers/me/doctor-feedback-summary", headers=headers)
    assert fb_resp.status_code == 200
    fb_data = fb_resp.json()
    assert fb_data["total_feedback"] == 2
    assert len(fb_data["categories"]) == 4

    # GET /api/v1/manufacturers/me/territory-summary
    terr_resp = client.get("/api/v1/manufacturers/me/territory-summary", headers=headers)
    assert terr_resp.status_code == 200
    assert terr_resp.json()["total"] == 0
    assert len(terr_resp.json()["items"]) == 0
