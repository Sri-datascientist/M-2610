import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config import settings
from app.auth import create_access_token, hash_password
from databases.session import Base, get_db
from databases.schema.models import User, Doctor, LibraryEntry, LibraryContribution, AuditHistory

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
        email="dr.ayush@ayurveda.org",
        hashed_password=hash_password("AyushPass123!"),
        role="doctor",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    doctor = Doctor(
        user_id=user.id,
        full_name="Dr. Ayush Sharma",
        medical_license_number="LIC-AYUSH-101",
        specialty="Panchakarma",
        verification_status="approved",
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(doctor)
    return user, doctor


@pytest.fixture
def other_doctor_user(db_session):
    user = User(
        email="dr.other@ayurveda.org",
        hashed_password=hash_password("OtherPass123!"),
        role="doctor",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    doctor = Doctor(
        user_id=user.id,
        full_name="Dr. Other Vaidya",
        medical_license_number="LIC-OTHER-202",
        specialty="Rasayana",
        verification_status="approved",
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(doctor)
    return user, doctor


@pytest.fixture
def admin_token():
    return create_access_token(user_id="admin-lib-1", role="admin")


@pytest.fixture
def doctor_token(doctor_user):
    user, _ = doctor_user
    return create_access_token(user_id=user.id, role="doctor")


@pytest.fixture
def other_doctor_token(other_doctor_user):
    user, _ = other_doctor_user
    return create_access_token(user_id=user.id, role="doctor")


def test_admin_create_and_update_library_entry(client, admin_token, db_session):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "title": "Clinical Efficacy of Ashwagandha in Stress Management",
        "summary": "An extensive review of adaptogenic properties of Withania somnifera.",
        "content": "Detailed full text clinical review analysis and patient outcomes...",
        "category": "Pharmacology",
        "source_references": ["https://doi.org/10.1016/j.jep.2020.113000"],
    }
    response = client.post("/api/v1/admin/library/entries", json=payload, headers=headers)
    assert response.status_code == 201
    entry_id = response.json()["id"]
    assert response.json()["is_published"] is True

    # Update entry
    update_res = client.patch(
        f"/api/v1/admin/library/entries/{entry_id}",
        json={"summary": "Updated executive clinical summary of Withania somnifera."},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert "Updated executive" in update_res.json()["summary"]


def test_public_browse_published_vs_unpublished(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin creates published entry
    pub_res = client.post(
        "/api/v1/admin/library/entries",
        json={
            "title": "Triphala: Therapeutic Applications",
            "summary": "A review of gastrointestinal benefits.",
            "content": "Complete scientific treatise on Terminalia and Emblica...",
            "category": "Digestive Health",
            "source_references": [],
        },
        headers=headers,
    )
    pub_id = pub_res.json()["id"]

    # 2. Admin unpublishes the entry
    client.patch(f"/api/v1/admin/library/entries/{pub_id}", json={"is_published": False}, headers=headers)

    # 3. Public GET by ID should return 404
    public_get = client.get(f"/api/v1/library/entries/{pub_id}")
    assert public_get.status_code == 404

    # 4. Public list should not contain unpublished entry
    public_list = client.get("/api/v1/library/entries?search=Triphala")
    assert not any(e["id"] == pub_id for e in public_list.json()["items"])

    # 5. Admin republishes the entry
    client.patch(f"/api/v1/admin/library/entries/{pub_id}", json={"is_published": True}, headers=headers)

    # 6. Public can now view
    public_get_after = client.get(f"/api/v1/library/entries/{pub_id}")
    assert public_get_after.status_code == 200
    assert public_get_after.json()["id"] == pub_id


def test_doctor_submit_contribution_and_list_own(client, doctor_token, other_doctor_token):
    headers = {"Authorization": f"Bearer {doctor_token}"}
    payload = {
        "title": "Role of Shirodhara in Neurological Rehabilitation",
        "summary": "Observational cohort study in post-stroke recovery.",
        "content": "Observational data gathered from 50 treated cases over 12 weeks...",
        "category": "Therapeutics",
        "source_references": ["Clinical Protocol 2024-NEURO"],
    }
    create_res = client.post("/api/v1/library/contributions", json=payload, headers=headers)
    assert create_res.status_code == 201
    contrib_id = create_res.json()["id"]
    assert create_res.json()["decision"] == "pending"

    # Doctor 1 lists own contributions
    own_list = client.get("/api/v1/doctors/me/library-contributions", headers=headers)
    assert own_list.status_code == 200
    assert any(c["id"] == contrib_id for c in own_list.json()["items"])

    # Doctor 2 lists own contributions -> should not see Doctor 1's contribution
    headers_other = {"Authorization": f"Bearer {other_doctor_token}"}
    other_list = client.get("/api/v1/doctors/me/library-contributions", headers=headers_other)
    assert other_list.status_code == 200
    assert not any(c["id"] == contrib_id for c in other_list.json()["items"])


def test_admin_review_contribution_decision(client, admin_token, doctor_token, db_session):
    headers_doc = {"Authorization": f"Bearer {doctor_token}"}
    payload = {
        "title": "Guduchi (Tinospora cordifolia) in Autoimmune Support",
        "summary": "Immunomodulatory properties observed in clinical practice.",
        "content": "Immunological markers tracking pre and post Guduchi administration...",
        "category": "Immunology",
        "source_references": [],
    }
    contrib_id = client.post("/api/v1/library/contributions", json=payload, headers=headers_doc).json()["id"]

    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # Admin lists contributions with filter
    pending_list = client.get("/api/v1/admin/library/contributions?decision=pending", headers=headers_admin)
    assert pending_list.status_code == 200
    assert any(c["id"] == contrib_id for c in pending_list.json()["items"])

    # Admin approves contribution
    decision_payload = {
        "decision": "approved",
        "notes": "Peer review complete; well-documented clinical observations.",
    }
    decide_res = client.patch(
        f"/api/v1/admin/library/contributions/{contrib_id}/decision",
        json=decision_payload,
        headers=headers_admin,
    )
    assert decide_res.status_code == 200
    assert decide_res.json()["decision"] == "approved"
    assert decide_res.json()["reviewer_notes"] == decision_payload["notes"]

    # When approved, it should now appear in the public library
    public_entries = client.get("/api/v1/library/entries?search=Guduchi")
    assert public_entries.status_code == 200
    assert any(e["title"] == payload["title"] for e in public_entries.json()["items"])

    # Check audit history
    audit = db_session.query(AuditHistory).filter(
        AuditHistory.target_id == contrib_id,
        AuditHistory.action == "LIBRARY_CONTRIBUTION_DECISION",
    ).first()
    assert audit is not None
    assert audit.details["new_decision"] == "approved"


def test_rbac_and_error_handling(client, doctor_token):
    # Public user / doctor trying to call admin create -> 403 Forbidden
    res_forbidden = client.post(
        "/api/v1/admin/library/entries",
        json={
            "title": "Unauthorized Entry",
            "summary": "...",
            "content": "...",
            "category": "General",
        },
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert res_forbidden.status_code == 403

    # Nonexistent entry lookup
    res_404 = client.get("/api/v1/library/entries/non-existent-entry-id")
    assert res_404.status_code == 404
