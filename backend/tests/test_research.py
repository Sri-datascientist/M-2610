import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config import settings
from app.auth import create_access_token, hash_password
from databases.session import Base, get_db
from databases.schema.models import User, Doctor, ResearchSubmission, AuditHistory

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
def doctor_author(db_session):
    user = User(
        email="dr.author@ayurveda.org",
        hashed_password=hash_password("DoctorPass123!"),
        role="doctor",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    doc = Doctor(
        user_id=user.id,
        full_name="Dr. Author Vaidya",
        medical_license_number="LIC-RES-001",
        specialty="Pharmacognosy",
        verification_status="approved",
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(doc)
    return user, doc


@pytest.fixture
def other_doctor(db_session):
    user = User(
        email="dr.other@ayurveda.org",
        hashed_password=hash_password("OtherDocPass123!"),
        role="doctor",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    doc = Doctor(
        user_id=user.id,
        full_name="Dr. Other Vaidya",
        medical_license_number="LIC-RES-002",
        specialty="Kayachikitsa",
        verification_status="approved",
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(doc)
    return user, doc


@pytest.fixture
def admin_token():
    return create_access_token(user_id="admin-res-1", role="admin")


@pytest.fixture
def author_token(doctor_author):
    user, _ = doctor_author
    return create_access_token(user_id=user.id, role="doctor")


@pytest.fixture
def other_doctor_token(other_doctor):
    user, _ = other_doctor
    return create_access_token(user_id=user.id, role="doctor")


def test_submit_research_and_list_own(client, author_token, other_doctor_token):
    headers = {"Authorization": f"Bearer {author_token}"}
    payload = {
        "submission_type": "formulation",
        "title": "Novel Polyherbal Synergy in Glycemic Management",
        "summary": "Mechanistic evaluation of combined Gymnema sylvestre and Momordica charantia.",
        "content": "Detailed standardized extraction protocol and metabolic profiling...",
        "attachments": ["https://doi.org/10.1016/protocol-101"],
    }
    create_res = client.post("/api/v1/research-submissions", json=payload, headers=headers)
    assert create_res.status_code == 201
    data = create_res.json()
    submission_id = data["id"]
    assert data["status"] == "submitted"
    assert data["title"] == payload["title"]

    # Author lists own submissions
    list_res = client.get("/api/v1/doctors/me/research-submissions", headers=headers)
    assert list_res.status_code == 200
    assert any(s["id"] == submission_id for s in list_res.json()["items"])

    # Other doctor cannot see Author's submission in their own list
    headers_other = {"Authorization": f"Bearer {other_doctor_token}"}
    other_list = client.get("/api/v1/doctors/me/research-submissions", headers=headers_other)
    assert other_list.status_code == 200
    assert not any(s["id"] == submission_id for s in other_list.json()["items"])


def test_cross_doctor_access_forbidden(client, author_token, other_doctor_token):
    headers_author = {"Authorization": f"Bearer {author_token}"}
    payload = {
        "submission_type": "case_study",
        "title": "Chronic Plaque Psoriasis Resolution via Classical Shodhana",
        "summary": "A 6-month clinical case series.",
        "content": "Subject profiles, PASI score progression, and dietary restrictions...",
        "attachments": [],
    }
    sub_id = client.post("/api/v1/research-submissions", json=payload, headers=headers_author).json()["id"]

    # Other doctor attempts to view -> 403 Forbidden
    headers_other = {"Authorization": f"Bearer {other_doctor_token}"}
    res_get = client.get(f"/api/v1/research-submissions/{sub_id}", headers=headers_other)
    assert res_get.status_code == 403
    assert "permission to view this submission" in res_get.json()["detail"]

    # Other doctor attempts to edit -> 403 Forbidden
    res_patch = client.patch(
        f"/api/v1/research-submissions/{sub_id}",
        json={"title": "Hacked Title"},
        headers=headers_other,
    )
    assert res_patch.status_code == 403


def test_author_update_and_admin_detail_access(client, author_token, admin_token, db_session):
    headers_author = {"Authorization": f"Bearer {author_token}"}
    payload = {
        "submission_type": "medical_details",
        "title": "Bioavailability Optimization of Curcumin via Piperine Complexes",
        "summary": "Pharmacokinetic trial in healthy volunteers.",
        "content": "Plasma concentration curves over 24 hours...",
        "attachments": [],
    }
    sub_id = client.post("/api/v1/research-submissions", json=payload, headers=headers_author).json()["id"]

    # Author updates summary
    update_res = client.patch(
        f"/api/v1/research-submissions/{sub_id}",
        json={"summary": "Updated 48-hour extended pharmacokinetic trial."},
        headers=headers_author,
    )
    assert update_res.status_code == 200
    assert "Updated 48-hour" in update_res.json()["summary"]

    # Admin accesses submission detail
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    admin_get = client.get(f"/api/v1/research-submissions/{sub_id}", headers=headers_admin)
    assert admin_get.status_code == 200
    assert admin_get.json()["id"] == sub_id

    # Admin lists submissions with filters
    admin_list = client.get(
        "/api/v1/admin/research-submissions?status=submitted&submission_type=medical_details",
        headers=headers_admin,
    )
    assert admin_list.status_code == 200
    assert any(s["id"] == sub_id for s in admin_list.json()["items"])


def test_nonexistent_submission_returns_404(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/research-submissions/non-existent-id", headers=headers)
    assert res.status_code == 404
    assert "Research submission not found" in res.json()["detail"]
