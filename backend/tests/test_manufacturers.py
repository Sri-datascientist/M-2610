import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config import settings
from app.auth import create_access_token, hash_password
from databases.session import Base, get_db
from databases.schema.models import User, Manufacturer, AuditHistory

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
def created_manufacturer_user(db_session):
    user = User(
        email="contact@ayurpharm.com",
        hashed_password=hash_password("MfgPassword123!"),
        role="manufacturer",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    mfg = Manufacturer(
        user_id=user.id,
        company_name="AyurPharm Naturals Ltd",
        contact_name="Rajesh Sharma",
        contact_email="contact@ayurpharm.com",
        verification_status="pending",
    )
    db_session.add(mfg)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(mfg)
    return user, mfg


@pytest.fixture
def admin_token():
    return create_access_token(user_id="admin-999", role="admin")


@pytest.fixture
def mfg_token(created_manufacturer_user):
    user, _ = created_manufacturer_user
    return create_access_token(user_id=user.id, role="manufacturer")


def test_manufacturer_registration_standalone(client):
    payload = {
        "company_name": "VedaBio Remedies",
        "contact_name": "Priya Nair",
        "contact_email": "priya@vedabio.com",
    }
    response = client.post("/api/v1/manufacturers", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["company_name"] == "VedaBio Remedies"
    assert data["contact_name"] == "Priya Nair"
    assert data["contact_email"] == "priya@vedabio.com"
    assert data["verification_status"] == "pending"


def test_manufacturer_registration_duplicate_email(client, created_manufacturer_user):
    _, mfg = created_manufacturer_user
    payload = {
        "company_name": "Different Company",
        "contact_name": "Another Person",
        "contact_email": mfg.contact_email,
    }
    response = client.post("/api/v1/manufacturers", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_manufacturer_registration_duplicate_company(client, created_manufacturer_user):
    _, mfg = created_manufacturer_user
    payload = {
        "company_name": mfg.company_name,
        "contact_name": "New Contact",
        "contact_email": "different.email@domain.com",
    }
    response = client.post("/api/v1/manufacturers", json=payload)
    assert response.status_code == 409
    assert "company name already exists" in response.json()["detail"]


def test_get_current_manufacturer_profile(client, mfg_token):
    headers = {"Authorization": f"Bearer {mfg_token}"}
    response = client.get("/api/v1/manufacturers/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == "AyurPharm Naturals Ltd"
    assert data["contact_name"] == "Rajesh Sharma"
    assert data["verification_status"] == "pending"


def test_update_current_manufacturer_profile(client, mfg_token):
    headers = {"Authorization": f"Bearer {mfg_token}"}
    payload = {
        "contact_name": "Rajesh V. Sharma",
        "contact_email": "rajesh.updated@ayurpharm.com",
    }
    response = client.patch("/api/v1/manufacturers/me", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["contact_name"] == "Rajesh V. Sharma"
    assert data["contact_email"] == "rajesh.updated@ayurpharm.com"


def test_admin_list_and_get_manufacturer(client, admin_token, created_manufacturer_user):
    headers = {"Authorization": f"Bearer {admin_token}"}
    _, mfg = created_manufacturer_user

    # Search and list
    res_list = client.get("/api/v1/admin/manufacturers?search=AyurPharm", headers=headers)
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] >= 1
    assert list_data["items"][0]["id"] == mfg.id

    # Get by ID
    res_get = client.get(f"/api/v1/admin/manufacturers/{mfg.id}", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == mfg.id


def test_admin_verification_decision_and_audit(client, admin_token, created_manufacturer_user, db_session):
    headers = {"Authorization": f"Bearer {admin_token}"}
    _, mfg = created_manufacturer_user

    decision_payload = {
        "decision": "approved",
        "notes": "GMP certification and manufacturing facility verified.",
    }
    res = client.patch(
        f"/api/v1/admin/manufacturers/{mfg.id}/verification",
        json=decision_payload,
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["verification_status"] == "approved"

    # Verify audit history entry
    audit = db_session.query(AuditHistory).filter(
        AuditHistory.target_id == mfg.id,
        AuditHistory.action == "MANUFACTURER_VERIFICATION_DECISION",
    ).first()
    assert audit is not None
    assert audit.details["new_status"] == "approved"
    assert audit.details["notes"] == "GMP certification and manufacturing facility verified."


def test_rbac_and_cross_user_restrictions(client, created_manufacturer_user):
    # Unauthenticated access to /me
    res_unauth = client.get("/api/v1/manufacturers/me")
    assert res_unauth.status_code == 401

    # Doctor attempting manufacturer endpoint
    doc_token = create_access_token(user_id="doc-555", role="doctor")
    res_doc = client.get("/api/v1/manufacturers/me", headers={"Authorization": f"Bearer {doc_token}"})
    assert res_doc.status_code == 403

    # Manufacturer attempting admin endpoint
    user, _ = created_manufacturer_user
    mfg_token = create_access_token(user_id=user.id, role="manufacturer")
    res_admin = client.get("/api/v1/admin/manufacturers", headers={"Authorization": f"Bearer {mfg_token}"})
    assert res_admin.status_code == 403


def test_nonexistent_manufacturer_returns_404(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/admin/manufacturers/non-existent-id", headers=headers)
    assert res.status_code == 404
    assert "Manufacturer not found" in res.json()["detail"]
