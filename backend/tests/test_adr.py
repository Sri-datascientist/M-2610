from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config import settings
from app.auth import create_access_token, hash_password
from databases.session import Base, get_db
from databases.schema.models import User, Doctor, Manufacturer, Product, AdrReport, AuditHistory

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
def doctor_fixture(db_session):
    user = User(
        email="doctor.adr@example.com",
        hashed_password=hash_password("DoctorPass123!"),
        role="doctor",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    doctor = Doctor(
        user_id=user.id,
        full_name="Dr. ADR Reporter",
        medical_license_number="LIC-ADR-001",
        specialty="Ayurvedic Toxicology",
        verification_status="approved",
    )
    db_session.add(doctor)
    db_session.commit()
    return user, doctor


@pytest.fixture
def manufacturer_fixture(db_session):
    # Manufacturer 1
    user1 = User(
        email="mfg1@ayurpharma.com",
        hashed_password=hash_password("MfgPass123!"),
        role="manufacturer",
        status="active",
    )
    db_session.add(user1)
    db_session.flush()

    mfg1 = Manufacturer(
        user_id=user1.id,
        company_name="AyurPharma Corp",
        contact_name="Ramesh Kumar",
        contact_email="ramesh@ayurpharma.com",
        verification_status="approved",
    )
    db_session.add(mfg1)
    db_session.flush()

    prod1 = Product(
        manufacturer_id=mfg1.id,
        name="Triphala Churna Premium",
        description="Classical digestive formulation",
        category="Digestive Care",
        price=15.99,
        approval_status="approved",
    )
    db_session.add(prod1)

    # Manufacturer 2
    user2 = User(
        email="mfg2@vedicherbs.com",
        hashed_password=hash_password("MfgPass123!"),
        role="manufacturer",
        status="active",
    )
    db_session.add(user2)
    db_session.flush()

    mfg2 = Manufacturer(
        user_id=user2.id,
        company_name="Vedic Herbs Ltd",
        contact_name="Suresh Patel",
        contact_email="suresh@vedicherbs.com",
        verification_status="approved",
    )
    db_session.add(mfg2)
    db_session.flush()

    prod2 = Product(
        manufacturer_id=mfg2.id,
        name="Ashwagandha Gold",
        description="Vitality and stress relief",
        category="General Wellness",
        price=22.50,
        approval_status="approved",
    )
    db_session.add(prod2)

    db_session.commit()
    return (user1, mfg1, prod1), (user2, mfg2, prod2)


@pytest.fixture
def admin_fixture(db_session):
    user = User(
        email="admin.adr@example.com",
        hashed_password=hash_password("AdminPass123!"),
        role="admin",
        status="active",
    )
    db_session.add(user)
    db_session.commit()
    return user


def auth_header(user):
    token = create_access_token(user.id, user.role)
    return {"Authorization": f"Bearer {token}"}


def test_submit_adr_report_success(client, doctor_fixture, manufacturer_fixture, db_session):
    user, doctor = doctor_fixture
    (mfg1_user, _, prod1), _ = manufacturer_fixture
    headers = auth_header(user)

    payload = {
        "product_id": prod1.id,
        "product_name": prod1.name,
        "reaction": "Mild abdominal cramping and nausea",
        "occurred_on": "2026-10-15",
        "outcome": "recovering",
        "seriousness": "non_serious",
        "description": "Patient reported stomach discomfort 2 hours after taking dosage with lukewarm water.",
    }

    resp = client.post("/api/v1/adr-reports", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] is not None
    assert data["doctor_id"] == doctor.id
    assert data["product_id"] == prod1.id
    assert data["product_name"] == prod1.name
    assert data["reaction"] == payload["reaction"]
    assert data["status"] == "submitted"
    assert "submitted_at" in data

    # Verify audit log
    audit = db_session.query(AuditHistory).filter(AuditHistory.target_id == data["id"]).first()
    assert audit is not None
    assert audit.action == "submit_adr_report"
    assert audit.actor_id == user.id


def test_submit_adr_invalid_product_or_fields(client, doctor_fixture):
    user, _ = doctor_fixture
    headers = auth_header(user)

    # Missing / nonexistent product ID
    payload = {
        "product_id": "nonexistent-product-id-9999",
        "product_name": "Ghost Product",
        "reaction": "Headache",
        "occurred_on": "2026-10-15",
        "outcome": "recovered",
        "seriousness": "non_serious",
        "description": "Short description",
    }
    resp = client.post("/api/v1/adr-reports", json=payload, headers=headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Product not found"

    # Invalid seriousness enum
    bad_payload = payload.copy()
    bad_payload["seriousness"] = "catastrophic"  # Invalid enum value
    resp = client.post("/api/v1/adr-reports", json=bad_payload, headers=headers)
    assert resp.status_code == 422


def test_adr_role_and_authentication_restrictions(client, doctor_fixture, manufacturer_fixture, admin_fixture):
    doc_user, _ = doctor_fixture
    (mfg1_user, _, prod1), _ = manufacturer_fixture
    admin = admin_fixture

    payload = {
        "product_id": prod1.id,
        "product_name": prod1.name,
        "reaction": "Rash",
        "occurred_on": "2026-10-15",
        "outcome": "recovered",
        "seriousness": "non_serious",
        "description": "Mild rash observed.",
    }

    # Unauthenticated
    resp = client.post("/api/v1/adr-reports", json=payload)
    assert resp.status_code == 401

    # Manufacturer cannot submit ADR reports
    resp = client.post("/api/v1/adr-reports", json=payload, headers=auth_header(mfg1_user))
    assert resp.status_code == 403

    # Doctor cannot access admin ADR reports
    resp = client.get("/api/v1/admin/adr-reports", headers=auth_header(doc_user))
    assert resp.status_code == 403

    # Admin cannot access manufacturer /me ADR reports
    resp = client.get("/api/v1/manufacturers/me/adr-reports", headers=auth_header(admin))
    assert resp.status_code == 403


def test_admin_adr_reports_listing_and_filtering(client, doctor_fixture, manufacturer_fixture, admin_fixture):
    doc_user, _ = doctor_fixture
    (mfg1_user, _, prod1), (mfg2_user, _, prod2) = manufacturer_fixture
    doc_headers = auth_header(doc_user)
    admin_headers = auth_header(admin_fixture)

    # Submit report for product 1 (non_serious)
    client.post(
        "/api/v1/adr-reports",
        json={
            "product_id": prod1.id,
            "product_name": prod1.name,
            "reaction": "Nausea",
            "occurred_on": "2026-10-10",
            "outcome": "recovered",
            "seriousness": "non_serious",
            "description": "Mild nausea",
        },
        headers=doc_headers,
    )

    # Submit report for product 2 (serious)
    client.post(
        "/api/v1/adr-reports",
        json={
            "product_id": prod2.id,
            "product_name": prod2.name,
            "reaction": "Severe hypotension",
            "occurred_on": "2026-10-12",
            "outcome": "recovering",
            "seriousness": "serious",
            "description": "Blood pressure dropped significantly",
        },
        headers=doc_headers,
    )

    # Admin lists all reports
    resp = client.get("/api/v1/admin/adr-reports", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 2

    # Filter by seriousness
    resp_serious = client.get("/api/v1/admin/adr-reports?seriousness=serious", headers=admin_headers)
    assert resp_serious.status_code == 200
    assert resp_serious.json()["total"] == 1
    assert resp_serious.json()["items"][0]["seriousness"] == "serious"

    # Filter by product_id
    resp_prod1 = client.get(f"/api/v1/admin/adr-reports?product_id={prod1.id}", headers=admin_headers)
    assert resp_prod1.status_code == 200
    assert resp_prod1.json()["total"] == 1
    assert resp_prod1.json()["items"][0]["product_id"] == prod1.id


def test_manufacturer_adr_isolation_and_cross_access_prevention(
    client, doctor_fixture, manufacturer_fixture
):
    doc_user, _ = doctor_fixture
    (mfg1_user, _, prod1), (mfg2_user, _, prod2) = manufacturer_fixture
    doc_headers = auth_header(doc_user)

    # Report 1 for mfg1's product
    client.post(
        "/api/v1/adr-reports",
        json={
            "product_id": prod1.id,
            "product_name": prod1.name,
            "reaction": "Dizziness",
            "occurred_on": "2026-10-01",
            "outcome": "recovered",
            "seriousness": "non_serious",
            "description": "Dizziness after morning dose",
        },
        headers=doc_headers,
    )

    # Report 2 for mfg2's product
    client.post(
        "/api/v1/adr-reports",
        json={
            "product_id": prod2.id,
            "product_name": prod2.name,
            "reaction": "Allergic hives",
            "occurred_on": "2026-10-02",
            "outcome": "recovering",
            "seriousness": "serious",
            "description": "Hives on upper arms",
        },
        headers=doc_headers,
    )

    # Mfg 1 queries their reports
    mfg1_resp = client.get("/api/v1/manufacturers/me/adr-reports", headers=auth_header(mfg1_user))
    assert mfg1_resp.status_code == 200
    mfg1_data = mfg1_resp.json()
    assert mfg1_data["total"] == 1
    assert mfg1_data["items"][0]["product_id"] == prod1.id

    # Mfg 2 queries their reports
    mfg2_resp = client.get("/api/v1/manufacturers/me/adr-reports", headers=auth_header(mfg2_user))
    assert mfg2_resp.status_code == 200
    mfg2_data = mfg2_resp.json()
    assert mfg2_data["total"] == 1
    assert mfg2_data["items"][0]["product_id"] == prod2.id

    # Mfg 1 queries with product_id belonging to mfg2 - should return empty list (not access mfg2's data)
    cross_resp = client.get(
        f"/api/v1/manufacturers/me/adr-reports?product_id={prod2.id}",
        headers=auth_header(mfg1_user),
    )
    assert cross_resp.status_code == 200
    assert cross_resp.json()["total"] == 0
    assert len(cross_resp.json()["items"]) == 0


def test_doctor_can_list_own_adr_reports(client, db_session, doctor_fixture, manufacturer_fixture):
    doc_user, doctor = doctor_fixture
    (mfg1_user, _, product), _ = manufacturer_fixture

    # Submit an ADR report
    sub_payload = {
        "product_id": product.id,
        "product_name": product.name,
        "reaction": "Mild nausea following morning dose",
        "occurred_on": "2026-10-05",
        "outcome": "recovered",
        "seriousness": "non_serious",
        "description": "Transient morning nausea resolved upon adjusting anupana.",
    }
    doc_token = create_access_token(user_id=doc_user.id, role="doctor")
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    post_resp = client.post("/api/v1/adr-reports", json=sub_payload, headers=doc_headers)
    assert post_resp.status_code == 201

    # Query own ADR reports
    get_resp = client.get("/api/v1/doctors/me/adr-reports", headers=doc_headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["total"] == 1
    assert data["items"][0]["reaction"] == "Mild nausea following morning dose"
    assert data["items"][0]["doctor_id"] == doctor.id

