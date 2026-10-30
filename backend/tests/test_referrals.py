import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config import settings
from app.auth import create_access_token, hash_password
from databases.session import Base, get_db
from databases.schema.models import User, Doctor, Referral, AuditHistory

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
    # Doctor 1
    user1 = User(
        email="dr.sharma@ayurveda.org",
        hashed_password=hash_password("DoctorPass123!"),
        role="doctor",
        status="active",
    )
    db_session.add(user1)
    db_session.flush()

    doc1 = Doctor(
        user_id=user1.id,
        full_name="Dr. Sharma Vaidya",
        medical_license_number="LIC-REF-001",
        specialty="Panchakarma",
        verification_status="approved",
    )
    db_session.add(doc1)

    # Doctor 2
    user2 = User(
        email="dr.verma@ayurveda.org",
        hashed_password=hash_password("DoctorPass123!"),
        role="doctor",
        status="active",
    )
    db_session.add(user2)
    db_session.flush()

    doc2 = Doctor(
        user_id=user2.id,
        full_name="Dr. Verma Vaidya",
        medical_license_number="LIC-REF-002",
        specialty="Rasayana",
        verification_status="approved",
    )
    db_session.add(doc2)

    db_session.commit()
    return (user1, doc1), (user2, doc2)


@pytest.fixture
def admin_fixture(db_session):
    user = User(
        email="admin.referrals@ayurveda.org",
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


def test_create_referral_success(client, doctor_fixture, db_session):
    (doc1_user, doc1), _ = doctor_fixture
    headers = auth_header(doc1_user)

    payload = {
        "referred_name": "Aarav Patel",
        "referred_contact": "aarav.patel@example.com",
        "reason": "Consultation for chronic arthritic pain management.",
    }

    resp = client.post("/api/v1/referrals", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] is not None
    assert data["referring_doctor_id"] == doc1.id
    assert data["referred_name"] == "Aarav Patel"
    assert data["referred_contact"] == "aarav.patel@example.com"
    assert data["status"] == "submitted"
    assert data["score_awarded"] == 0
    assert "created_at" in data

    # Verify audit log recorded
    audit = db_session.query(AuditHistory).filter(AuditHistory.target_id == data["id"]).first()
    assert audit is not None
    assert audit.action == "create_referral"
    assert audit.actor_id == doc1_user.id


def test_prevent_self_referral_and_duplicates(client, doctor_fixture):
    (doc1_user, doc1), _ = doctor_fixture
    headers = auth_header(doc1_user)

    # 1. Self-referral via matching doctor's account email
    self_email_payload = {
        "referred_name": "Someone Else",
        "referred_contact": doc1_user.email,
        "reason": "Self referral attempt",
    }
    resp = client.post("/api/v1/referrals", json=self_email_payload, headers=headers)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Self-referrals are not permitted"

    # 2. Self-referral via matching doctor's full name
    self_name_payload = {
        "referred_name": doc1.full_name,
        "referred_contact": "different.contact@example.com",
        "reason": "Self referral attempt by name",
    }
    resp = client.post("/api/v1/referrals", json=self_name_payload, headers=headers)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Self-referrals are not permitted"

    # 3. Create a valid referral
    valid_payload = {
        "referred_name": "Kavita Rao",
        "referred_contact": "kavita.rao@example.com",
        "reason": "Digestive wellness program",
    }
    resp = client.post("/api/v1/referrals", json=valid_payload, headers=headers)
    assert resp.status_code == 201

    # 4. Attempt duplicate referral with identical contact from same doctor
    dup_resp = client.post("/api/v1/referrals", json=valid_payload, headers=headers)
    assert dup_resp.status_code == 409
    assert dup_resp.json()["detail"] == "A referral for this contact has already been created by you"


def test_doctor_referral_isolation_and_ownership(client, doctor_fixture):
    (doc1_user, doc1), (doc2_user, doc2) = doctor_fixture
    doc1_headers = auth_header(doc1_user)
    doc2_headers = auth_header(doc2_user)

    # Doctor 1 submits referral
    client.post(
        "/api/v1/referrals",
        json={
            "referred_name": "Patient One",
            "referred_contact": "patient1@example.com",
            "reason": "Digestive health",
        },
        headers=doc1_headers,
    )

    # Doctor 2 submits referral
    client.post(
        "/api/v1/referrals",
        json={
            "referred_name": "Patient Two",
            "referred_contact": "patient2@example.com",
            "reason": "Stress management",
        },
        headers=doc2_headers,
    )

    # Doctor 1 lists own referrals: only patient 1
    d1_resp = client.get("/api/v1/doctors/me/referrals", headers=doc1_headers)
    assert d1_resp.status_code == 200
    d1_data = d1_resp.json()
    assert d1_data["total"] == 1
    assert d1_data["items"][0]["referring_doctor_id"] == doc1.id
    assert d1_data["items"][0]["referred_name"] == "Patient One"

    # Doctor 2 lists own referrals: only patient 2
    d2_resp = client.get("/api/v1/doctors/me/referrals", headers=doc2_headers)
    assert d2_resp.status_code == 200
    d2_data = d2_resp.json()
    assert d2_data["total"] == 1
    assert d2_data["items"][0]["referring_doctor_id"] == doc2.id
    assert d2_data["items"][0]["referred_name"] == "Patient Two"


def test_referral_score_calculation(client, doctor_fixture, db_session):
    (doc1_user, doc1), (doc2_user, doc2) = doctor_fixture
    doc1_headers = auth_header(doc1_user)
    doc2_headers = auth_header(doc2_user)

    # Initially Doctor 1 has score 0, count 0
    score_resp = client.get("/api/v1/doctors/me/referral-score", headers=doc1_headers)
    assert score_resp.status_code == 200
    assert score_resp.json()["score"] == 0
    assert score_resp.json()["referral_count"] == 0

    # Add a submitted referral (yields 1 point)
    client.post(
        "/api/v1/referrals",
        json={"referred_name": "Ref 1", "referred_contact": "ref1@example.com", "reason": "Reason 1"},
        headers=doc1_headers,
    )

    score_resp = client.get("/api/v1/doctors/me/referral-score", headers=doc1_headers)
    assert score_resp.status_code == 200
    assert score_resp.json()["score"] == 1
    assert score_resp.json()["referral_count"] == 1

    # Doctor 2 remains unaffected
    d2_score = client.get("/api/v1/doctors/me/referral-score", headers=doc2_headers)
    assert d2_score.json()["score"] == 0
    assert d2_score.json()["referral_count"] == 0


def test_admin_referrals_and_leaderboard(client, doctor_fixture, admin_fixture, db_session):
    (doc1_user, doc1), (doc2_user, doc2) = doctor_fixture
    doc1_headers = auth_header(doc1_user)
    doc2_headers = auth_header(doc2_user)
    admin_headers = auth_header(admin_fixture)

    # Doc 1 creates 2 referrals
    client.post(
        "/api/v1/referrals",
        json={"referred_name": "User Alpha", "referred_contact": "alpha@example.com", "reason": "Skin condition"},
        headers=doc1_headers,
    )
    client.post(
        "/api/v1/referrals",
        json={"referred_name": "User Beta", "referred_contact": "beta@example.com", "reason": "Insomnia"},
        headers=doc1_headers,
    )

    # Doc 2 creates 1 completed referral with custom score
    ref2 = Referral(
        referring_doctor_id=doc2.id,
        referred_name="User Gamma",
        referred_contact="gamma@example.com",
        reason="Detox program",
        status="completed",
        score_awarded=25,
    )
    db_session.add(ref2)
    db_session.commit()

    # Admin lists all referrals
    admin_list = client.get("/api/v1/admin/referrals", headers=admin_headers)
    assert admin_list.status_code == 200
    assert admin_list.json()["total"] == 3

    # Admin filters by doctor_id
    doc1_filter = client.get(f"/api/v1/admin/referrals?doctor_id={doc1.id}", headers=admin_headers)
    assert doc1_filter.status_code == 200
    assert doc1_filter.json()["total"] == 2

    # Admin leaderboard
    leaderboard = client.get("/api/v1/admin/referral-leaderboard", headers=admin_headers)
    assert leaderboard.status_code == 200
    lb_data = leaderboard.json()
    assert lb_data["total"] == 2
    # Doctor 2 has 25 points -> Rank 1
    assert lb_data["items"][0]["doctor_id"] == doc2.id
    assert lb_data["items"][0]["score"] == 25
    assert lb_data["items"][0]["rank"] == 1

    # Doctor 1 has 2 points -> Rank 2
    assert lb_data["items"][1]["doctor_id"] == doc1.id
    assert lb_data["items"][1]["score"] == 2
    assert lb_data["items"][1]["rank"] == 2


def test_referral_authorization_restrictions(client, doctor_fixture, admin_fixture):
    (doc1_user, doc1), _ = doctor_fixture
    admin = admin_fixture

    # Unauthenticated
    resp = client.get("/api/v1/doctors/me/referrals")
    assert resp.status_code == 401

    resp = client.get("/api/v1/admin/referrals")
    assert resp.status_code == 401

    # Doctor cannot access admin endpoints
    resp = client.get("/api/v1/admin/referrals", headers=auth_header(doc1_user))
    assert resp.status_code == 403

    resp = client.get("/api/v1/admin/referral-leaderboard", headers=auth_header(doc1_user))
    assert resp.status_code == 403

    # Admin cannot access doctor /me referral endpoints
    resp = client.get("/api/v1/doctors/me/referrals", headers=auth_header(admin))
    assert resp.status_code == 403

    resp = client.get("/api/v1/doctors/me/referral-score", headers=auth_header(admin))
    assert resp.status_code == 403


def test_create_colleague_invitation_with_email_dispatch(client, doctor_fixture, db_session):
    (doc1_user, doc1), _ = doctor_fixture
    headers = auth_header(doc1_user)

    payload = {
        "name": "Dr. Aarav Varma",
        "email": "aarav.varma@ayurveda-institute.org",
        "mobile": "+91 98765 43210",
        "qualification": "BAMS",
    }

    resp = client.post("/api/v1/referrals", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] is not None
    assert data["referred_name"] == "Dr. Aarav Varma"
    assert data["referred_contact"] == "aarav.varma@ayurveda-institute.org"
    assert "BAMS" in data["reason"]
    assert "+91 98765 43210" in data["reason"]
    assert data["invite_code"] is not None
    assert "register?ref=" in (data["registration_url"] or "")
    assert data["email_dispatched"] is True

