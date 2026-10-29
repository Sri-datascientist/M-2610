import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config import settings
from app.auth import create_access_token, hash_password
from databases.session import Base, get_db
from databases.schema.models import User, Doctor, DoctorCertification, AuditHistory

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
def created_doctor_user(db_session):
    user = User(
        email="active.doctor@example.com",
        hashed_password=hash_password("DoctorSecret123!"),
        role="doctor",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    doctor = Doctor(
        user_id=user.id,
        full_name="Dr. Gregory House",
        medical_license_number="LIC-MED-1001",
        specialty="Diagnostics",
        verification_status="pending",
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(doctor)
    return user, doctor


@pytest.fixture
def admin_token():
    return create_access_token(user_id="admin-999", role="admin")


@pytest.fixture
def doctor_token(created_doctor_user):
    user, _ = created_doctor_user
    return create_access_token(user_id=user.id, role="doctor")


def test_doctor_registration_standalone(client):
    payload = {
        "full_name": "Dr. Allison Cameron",
        "email": "cameron@hospital.com",
        "medical_license_number": "LIC-CAM-2002",
        "specialty": "Immunology",
    }
    response = client.post("/api/v1/doctors", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Dr. Allison Cameron"
    assert data["medical_license_number"] == "LIC-CAM-2002"
    assert data["verification_status"] == "pending"


def test_doctor_registration_duplicate_license(client, created_doctor_user):
    _, doctor = created_doctor_user
    payload = {
        "full_name": "Dr. Duplicate",
        "email": "duplicate@hospital.com",
        "medical_license_number": doctor.medical_license_number,
        "specialty": "Neurology",
    }
    response = client.post("/api/v1/doctors", json=payload)
    assert response.status_code == 409
    assert "medical license number already exists" in response.json()["detail"]


def test_get_current_doctor_profile(client, doctor_token):
    headers = {"Authorization": f"Bearer {doctor_token}"}
    response = client.get("/api/v1/doctors/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Dr. Gregory House"
    assert data["specialty"] == "Diagnostics"


def test_update_current_doctor_profile(client, doctor_token):
    headers = {"Authorization": f"Bearer {doctor_token}"}
    update_payload = {
        "specialty": "Infectious Disease",
        "full_name": "Dr. G. House, M.D.",
    }
    response = client.patch("/api/v1/doctors/me", json=update_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["specialty"] == "Infectious Disease"
    assert data["full_name"] == "Dr. G. House, M.D."


def test_doctor_submit_certification_and_get_verification(client, doctor_token):
    headers = {"Authorization": f"Bearer {doctor_token}"}
    cert_payload = {
        "certification_name": "Board Certification in Diagnostics",
        "issuing_organization": "American Board of Internal Medicine",
        "issue_date": str(date(2020, 5, 10)),
        "expiration_date": str(date(2030, 5, 10)),
        "evidence_reference": "https://abim.org/verify/LIC-MED-1001",
    }
    res_cert = client.post("/api/v1/doctors/me/certifications", json=cert_payload, headers=headers)
    assert res_cert.status_code == 201
    cert_data = res_cert.json()
    assert cert_data["certification_name"] == cert_payload["certification_name"]
    assert cert_data["verification_status"] == "pending"

    # Get verification status
    res_verif = client.get("/api/v1/doctors/me/verification", headers=headers)
    assert res_verif.status_code == 200
    verif_data = res_verif.json()
    assert verif_data["status"] == "pending"
    assert len(verif_data["certifications"]) == 1
    assert verif_data["certifications"][0]["id"] == cert_data["id"]


def test_admin_list_and_get_doctor(client, admin_token, created_doctor_user):
    headers = {"Authorization": f"Bearer {admin_token}"}
    _, doctor = created_doctor_user

    # List doctors
    res_list = client.get("/api/v1/admin/doctors?search=Gregory", headers=headers)
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] >= 1
    assert list_data["items"][0]["id"] == doctor.id

    # Get doctor by ID
    res_get = client.get(f"/api/v1/admin/doctors/{doctor.id}", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == doctor.id


def test_admin_verification_decision_and_audit(client, admin_token, created_doctor_user, db_session):
    headers = {"Authorization": f"Bearer {admin_token}"}
    _, doctor = created_doctor_user

    decision_payload = {
        "decision": "approved",
        "notes": "Verified against state medical council database.",
    }
    res = client.patch(
        f"/api/v1/admin/doctors/{doctor.id}/verification",
        json=decision_payload,
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["verification_status"] == "approved"

    # Verify audit history
    audit_entry = db_session.query(AuditHistory).filter(
        AuditHistory.target_id == doctor.id,
        AuditHistory.action == "DOCTOR_VERIFICATION_DECISION",
    ).first()
    assert audit_entry is not None
    assert audit_entry.details["new_status"] == "approved"


def test_rbac_doctor_endpoints_restrictions(client, created_doctor_user):
    # Unauthenticated access to /api/v1/doctors/me
    res_unauth = client.get("/api/v1/doctors/me")
    assert res_unauth.status_code == 401

    # Manufacturer attempting to access doctor/me
    mfg_token = create_access_token(user_id="mfg-888", role="manufacturer")
    res_mfg = client.get("/api/v1/doctors/me", headers={"Authorization": f"Bearer {mfg_token}"})
    assert res_mfg.status_code == 403

    # Doctor attempting admin listing
    doc_user, _ = created_doctor_user
    doc_token = create_access_token(user_id=doc_user.id, role="doctor")
    res_doc_admin = client.get("/api/v1/admin/doctors", headers={"Authorization": f"Bearer {doc_token}"})
    assert res_doc_admin.status_code == 403
