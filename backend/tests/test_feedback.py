import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config import settings
from app.auth import create_access_token, hash_password
from databases.session import Base, get_db
from databases.schema.models import User, Doctor, Feedback, AuditHistory

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
def doctor_user(db_session):
    user = User(
        email="doctor.feedback@example.com",
        hashed_password=hash_password("DoctorPass123!"),
        role="doctor",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    doctor = Doctor(
        user_id=user.id,
        full_name="Dr. Ayurvedic Expert",
        medical_license_number="LIC-FB-001",
        specialty="General Medicine",
        verification_status="approved",
    )
    db_session.add(doctor)
    db_session.commit()
    return user, doctor


@pytest.fixture
def admin_user(db_session):
    user = User(
        email="admin.feedback@example.com",
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


def test_doctor_feedback_submission(client, doctor_user, db_session):
    user, doctor = doctor_user
    headers = auth_header(user)

    payload = {
        "category": "product",
        "subject": "Ashwagandha Quality Issue",
        "message": "The latest batch formulation has slight consistency changes.",
    }

    resp = client.post("/api/v1/feedback", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] is not None
    assert data["doctor_id"] == doctor.id
    assert data["category"] == "product"
    assert data["subject"] == "Ashwagandha Quality Issue"
    assert data["status"] == "new"
    assert data["admin_notes"] is None
    assert "submitted_at" in data

    # Verify audit history logged
    audit = db_session.query(AuditHistory).filter(AuditHistory.target_id == data["id"]).first()
    assert audit is not None
    assert audit.action == "submit_feedback"
    assert audit.actor_id == user.id


def test_feedback_submission_validation(client, doctor_user):
    user, _ = doctor_user
    headers = auth_header(user)

    # Empty subject
    bad_payload = {
        "category": "product",
        "subject": "",
        "message": "Valid message",
    }
    resp = client.post("/api/v1/feedback", json=bad_payload, headers=headers)
    assert resp.status_code == 422

    # Invalid category
    invalid_category = {
        "category": "unsupported_cat",
        "subject": "Valid subject",
        "message": "Valid message",
    }
    resp = client.post("/api/v1/feedback", json=invalid_category, headers=headers)
    assert resp.status_code == 422


def test_feedback_role_and_auth_restrictions(client, admin_user, doctor_user):
    admin = admin_user
    doctor, _ = doctor_user

    payload = {
        "category": "website",
        "subject": "Portal Loading Time",
        "message": "Pages load slightly slow on mobile connections.",
    }

    # Unauthenticated submission
    resp = client.post("/api/v1/feedback", json=payload)
    assert resp.status_code == 401

    # Admin cannot submit doctor feedback (endpoint restricted to doctor role)
    resp = client.post("/api/v1/feedback", json=payload, headers=auth_header(admin))
    assert resp.status_code == 403

    # Doctor cannot access admin listing or admin patch
    resp = client.get("/api/v1/admin/feedback", headers=auth_header(doctor))
    assert resp.status_code == 403

    resp = client.patch("/api/v1/admin/feedback/any-id", json={"status": "resolved"}, headers=auth_header(doctor))
    assert resp.status_code == 403


def test_admin_feedback_list_and_filtering(client, doctor_user, admin_user):
    user, _ = doctor_user
    doctor_headers = auth_header(user)
    admin_headers = auth_header(admin_user)

    # Submit 2 feedback items: product and website
    client.post(
        "/api/v1/feedback",
        json={"category": "product", "subject": "Sub 1", "message": "Msg 1"},
        headers=doctor_headers,
    )
    client.post(
        "/api/v1/feedback",
        json={"category": "website", "subject": "Sub 2", "message": "Msg 2"},
        headers=doctor_headers,
    )

    # List all
    resp = client.get("/api/v1/admin/feedback", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Filter by category
    resp_prod = client.get("/api/v1/admin/feedback?category=product", headers=admin_headers)
    assert resp_prod.status_code == 200
    assert resp_prod.json()["total"] == 1
    assert resp_prod.json()["items"][0]["category"] == "product"

    # Filter by status
    resp_new = client.get("/api/v1/admin/feedback?status=new", headers=admin_headers)
    assert resp_new.status_code == 200
    assert resp_new.json()["total"] == 2

    resp_resolved = client.get("/api/v1/admin/feedback?status=resolved", headers=admin_headers)
    assert resp_resolved.status_code == 200
    assert resp_resolved.json()["total"] == 0


def test_admin_feedback_update(client, doctor_user, admin_user, db_session):
    user, _ = doctor_user
    doctor_headers = auth_header(user)
    admin_headers = auth_header(admin_user)

    create_resp = client.post(
        "/api/v1/feedback",
        json={"category": "service", "subject": "Delivery SLA", "message": "Delayed by 2 days."},
        headers=doctor_headers,
    )
    fb_id = create_resp.json()["id"]

    # Admin updates status to in_review and adds admin notes
    update_resp = client.patch(
        f"/api/v1/admin/feedback/{fb_id}",
        json={"status": "in_review", "admin_notes": "Investigating with logistics partner"},
        headers=admin_headers,
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["status"] == "in_review"
    assert updated_data["admin_notes"] == "Investigating with logistics partner"

    # Verify audit history
    audit = db_session.query(AuditHistory).filter(
        AuditHistory.target_id == fb_id,
        AuditHistory.action == "update_feedback",
    ).first()
    assert audit is not None
    assert audit.actor_id == admin_user.id

    # Admin resolves feedback
    resolve_resp = client.patch(
        f"/api/v1/admin/feedback/{fb_id}",
        json={"status": "resolved"},
        headers=admin_headers,
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "resolved"
    # Existing admin_notes preserved
    assert resolve_resp.json()["admin_notes"] == "Investigating with logistics partner"


def test_admin_update_nonexistent_feedback(client, admin_user):
    admin_headers = auth_header(admin_user)
    resp = client.patch(
        "/api/v1/admin/feedback/nonexistent-uuid-1234",
        json={"status": "resolved"},
        headers=admin_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Feedback not found"
