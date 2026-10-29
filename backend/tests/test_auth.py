import os
import pytest
from datetime import timedelta
import jwt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.config import settings
from databases.session import Base, get_db
from databases.schema.models import User, Doctor, Manufacturer

# Use SQLite in-memory for testing
from sqlalchemy.pool import StaticPool

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_jwt_secret():
    # Ensure JWT secret and test environment are set for tests
    os.environ["ENVIRONMENT"] = "development"
    settings.ENVIRONMENT = "development"
    settings.JWT_SECRET_KEY = "testsecretkeyforunitandintegrationtestingatleast32charslong!"


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


def test_successful_doctor_registration(client):
    payload = {
        "email": "doctor.test@example.com",
        "password": "Password123!",
        "role": "doctor",
        "full_name_or_company": "Dr. Sarah Connor",
        "medical_license_or_contact_name": "MED-998877",
        "specialty_or_contact_email": "Cardiology",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "doctor.test@example.com"
    assert data["role"] == "doctor"
    assert "password" not in data
    assert "hashed_password" not in data


def test_duplicate_email_registration_rejected(client):
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "role": "doctor",
        "full_name_or_company": "Dr. First",
        "medical_license_or_contact_name": "MED-111111",
        "specialty_or_contact_email": "General",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with same email
    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


def test_duplicate_medical_license_rejected(client):
    payload1 = {
        "email": "doctor.license1@example.com",
        "password": "Password123!",
        "role": "doctor",
        "full_name_or_company": "Dr. First",
        "medical_license_or_contact_name": "MED-UNIQUE-999",
        "specialty_or_contact_email": "Ayurveda",
    }
    res1 = client.post("/api/v1/auth/register", json=payload1)
    assert res1.status_code == 201

    payload2 = {
        "email": "doctor.license2@example.com",
        "password": "Password123!",
        "role": "doctor",
        "full_name_or_company": "Dr. Second",
        "medical_license_or_contact_name": "MED-UNIQUE-999",
        "specialty_or_contact_email": "Ayurveda",
    }
    res2 = client.post("/api/v1/auth/register", json=payload2)
    assert res2.status_code == 409
    assert "medical license or registration number" in res2.json()["detail"]


def test_admin_registration_rejected(client):
    payload = {
        "email": "admin@example.com",
        "password": "Password123!",
        "role": "admin",
        "full_name_or_company": "Admin User",
        "medical_license_or_contact_name": "ADM-001",
        "specialty_or_contact_email": "IT",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    # Pydantic Literal validation rejects role="admin" with 422
    assert response.status_code == 422


def test_successful_login_and_token_response(client):
    reg_payload = {
        "email": "mfg.login@example.com",
        "password": "MfgPassword123!",
        "role": "manufacturer",
        "full_name_or_company": "BioHerbs Ltd",
        "medical_license_or_contact_name": "Alice Green",
        "specialty_or_contact_email": "alice@bioherbs.com",
    }
    res_reg = client.post("/api/v1/auth/register", json=reg_payload)
    assert res_reg.status_code == 201

    # Login
    login_payload = {
        "email": "mfg.login@example.com",
        "password": "MfgPassword123!",
    }
    res_login = client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    token_data = res_login.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["role"] == "manufacturer"
    assert "password" not in token_data


def test_login_incorrect_password(client):
    reg_payload = {
        "email": "wrongpwd@example.com",
        "password": "RealPassword123!",
        "role": "doctor",
        "full_name_or_company": "Dr. Wrong",
        "medical_license_or_contact_name": "MED-554433",
        "specialty_or_contact_email": "Pediatrics",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "wrongpwd@example.com",
        "password": "WrongPassword999!",
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_get_me_with_authenticated_jwt(client):
    reg_payload = {
        "email": "profile@example.com",
        "password": "Password123!",
        "role": "doctor",
        "full_name_or_company": "Dr. Profile",
        "medical_license_or_contact_name": "MED-776655",
        "specialty_or_contact_email": "Dermatology",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    # Login to get token
    login_res = client.post("/api/v1/auth/login", json={"email": "profile@example.com", "password": "Password123!"})
    token = login_res.json()["access_token"]

    # Access /api/v1/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "profile@example.com"
    assert me_data["role"] == "doctor"
    assert me_data["status"] == "active"
    assert "password" not in me_data
    assert "hashed_password" not in me_data


def test_missing_and_invalid_token(client):
    # Missing token
    res1 = client.get("/api/v1/auth/me")
    assert res1.status_code == 401
    assert "Bearer token required" in res1.json()["detail"]

    # Malformed token
    res2 = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer malformed.token.value"})
    assert res2.status_code == 401

    # Expired token
    from datetime import datetime, timezone
    expired_payload = {
        "sub": "some-id",
        "role": "doctor",
        "exp": int((datetime.now(timezone.utc) - timedelta(hours=1)).timestamp()),
    }
    expired_token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    res3 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res3.status_code == 401
    assert "Token has expired" in res3.json()["detail"]


def test_role_based_access_authorization(client):
    from app.auth import create_access_token

    # Create doctor token and test doctor-only vs manufacturer/admin access
    doc_token = create_access_token(user_id="doc-123", role="doctor")
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    # Doctor trying to access admin dashboard summary -> 403 Forbidden
    res_admin = client.get("/api/v1/admin/dashboard/summary", headers=doc_headers)
    assert res_admin.status_code == 403
    assert "Insufficient permissions" in res_admin.json()["detail"]

    # Doctor trying to access manufacturer endpoint -> 403 Forbidden
    res_mfg = client.get("/api/v1/manufacturers/me/dashboard", headers=doc_headers)
    assert res_mfg.status_code == 403

    # Manufacturer token trying to access doctor certification endpoint -> 403 Forbidden
    mfg_token = create_access_token(user_id="mfg-123", role="manufacturer")
    mfg_headers = {"Authorization": f"Bearer {mfg_token}"}

    res_doc = client.get("/api/v1/doctors/me/verification", headers=mfg_headers)
    assert res_doc.status_code == 403


def test_otp_lifecycle_and_single_use(client):
    target = "doctor.test.otp@example.com"
    send_res = client.post("/api/v1/auth/send-otp", json={"target": target, "channel": "email"})
    assert send_res.status_code == 200
    demo_otp = send_res.json()["demo_otp"]
    assert demo_otp is not None
    assert len(demo_otp) == 6

    # Verify with correct OTP
    verify_res = client.post("/api/v1/auth/verify-otp", json={"target": target, "otp": demo_otp})
    assert verify_res.status_code == 200
    v_token = verify_res.json()["verification_token"]
    assert v_token is not None

    # Single-use check: Attempting to verify the same OTP again fails with 400
    reuse_res = client.post("/api/v1/auth/verify-otp", json={"target": target, "otp": demo_otp})
    assert reuse_res.status_code == 400


def test_otp_resend_cooldown(client):
    target = "cooldown.test@example.com"
    res1 = client.post("/api/v1/auth/send-otp", json={"target": target, "channel": "email"})
    assert res1.status_code == 200

    # Immediate second send within cooldown -> 429
    res2 = client.post("/api/v1/auth/send-otp", json={"target": target, "channel": "email"})
    assert res2.status_code == 429
    assert "Please wait" in res2.json()["detail"]


def test_otp_attempt_limits(client):
    target = "attempts.test@example.com"
    send_res = client.post("/api/v1/auth/send-otp", json={"target": target, "channel": "email"})
    assert send_res.status_code == 200

    # 1st wrong attempt
    r1 = client.post("/api/v1/auth/verify-otp", json={"target": target, "otp": "000000"})
    assert r1.status_code == 400
    assert "2 attempts remaining" in r1.json()["detail"]

    # 2nd wrong attempt
    r2 = client.post("/api/v1/auth/verify-otp", json={"target": target, "otp": "000000"})
    assert r2.status_code == 400
    assert "1 attempts remaining" in r2.json()["detail"]

    # 3rd wrong attempt -> invalidates session
    r3 = client.post("/api/v1/auth/verify-otp", json={"target": target, "otp": "000000"})
    assert r3.status_code == 400
    assert "Maximum verification attempts exceeded" in r3.json()["detail"]


def test_logout_revokes_token(client):
    # Register and login to obtain a valid token
    reg_payload = {
        "email": "logout.test@example.com",
        "password": "Password123!",
        "role": "doctor",
        "full_name": "Dr. Logout Test",
        "doctor_register_number": "MED-LOGOUT-001",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201

    login_res = client.post("/api/v1/auth/login", json={"email": "logout.test@example.com", "password": "Password123!"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify access works before logout
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200

    # Call logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # Verify access is now rejected with 401 Revoked
    me_after_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_after_res.status_code == 401
    assert "revoked" in me_after_res.json()["detail"].lower()


def test_zoho_cpaas_email_provider(monkeypatch):
    from unittest.mock import MagicMock
    import httpx
    from app.services.otp_service import ZohoCpaasEmailProvider

    captured_requests = []

    def mock_post(url, json=None, headers=None):
        captured_requests.append({"url": url, "json": json, "headers": headers})
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = '{"status":"success","message":"Email submitted"}'
        return mock_resp

    monkeypatch.setattr(httpx.Client, "post", lambda self, url, **kwargs: mock_post(url, **kwargs))

    provider = ZohoCpaasEmailProvider(
        api_key="my_secret_zoho_key",
        from_address="noreply@meyveda.com",
        from_name="Meyveda Clinical",
    )

    success = provider.send_email("doctor@example.com", "829104")
    assert success is True
    assert len(captured_requests) == 1

    req = captured_requests[0]
    assert req["url"] == "https://cpaas.zoho.in/v1.1/email"
    assert req["headers"]["authorization"] == "Zoho-enczapikey my_secret_zoho_key"
    assert req["headers"]["content-type"] == "application/json"
    assert req["json"]["from"]["address"] == "noreply@meyveda.com"
    assert req["json"]["to"][0]["email_address"]["address"] == "doctor@example.com"
    assert "829104" in req["json"]["htmlbody"]


def test_msg91_sms_provider(monkeypatch):
    from unittest.mock import MagicMock
    import httpx
    from app.services.otp_service import Msg91SmsProvider

    captured_requests = []

    def mock_post(url, params=None, json=None, headers=None, **kwargs):
        captured_requests.append({"url": url, "params": params, "json": json, "headers": headers})
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.headers = {"content-type": "application/json"}
        mock_resp.json.return_value = {"message": "OTP sent successfully", "type": "success", "request_id": "req-9871"}
        return mock_resp

    monkeypatch.setattr(httpx.Client, "post", lambda self, url, **kwargs: mock_post(url, **kwargs))

    provider = Msg91SmsProvider(authkey="test_msg91_key_999", template_id="template_1234")

    # Test with standard +91 international number
    success = provider.send_sms("+919876543210", "452918")
    assert success is True
    assert len(captured_requests) == 1

    req = captured_requests[0]
    assert req["url"] == "https://control.msg91.com/api/v5/otp"
    assert req["headers"]["authkey"] == "test_msg91_key_999"
    assert req["params"]["template_id"] == "template_1234"
    assert req["params"]["mobile"] == "919876543210"
    assert req["params"]["otp"] == "452918"
    assert req["params"]["otp_length"] == "6"
    assert req["params"]["otp_expiry"] == "5"

    # Test with 10-digit Indian number without country code (should auto-prepend 91)
    captured_requests.clear()
    provider.send_sms("9876543210", "123456")
    assert len(captured_requests) == 1
    assert captured_requests[0]["params"]["mobile"] == "919876543210"


def test_msg91_widget_provider(monkeypatch):
    from unittest.mock import MagicMock
    import httpx
    from app.services.otp_service import Msg91WidgetProvider

    captured_requests = []

    def mock_post(url, json=None, headers=None, **kwargs):
        captured_requests.append({"url": url, "json": json, "headers": headers})
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.headers = {"content-type": "application/json"}
        if "sendOtp" in url:
            mock_resp.json.return_value = {"message": "req_widget_abc123", "type": "success"}
        else:
            mock_resp.json.return_value = {"message": "OTP Verified Successfully", "type": "success"}
        return mock_resp

    monkeypatch.setattr(httpx.Client, "post", lambda self, url, **kwargs: mock_post(url, **kwargs))

    provider = Msg91WidgetProvider(authkey="widget_auth_key_111", widget_id="widget_id_999")

    # Send SMS test
    sent = provider.send_sms("9876543210", "654321")
    assert sent is True
    assert provider.last_req_id == "req_widget_abc123"
    assert len(captured_requests) == 1
    req = captured_requests[0]
    assert req["url"] == "https://api.msg91.com/api/v5/widget/sendOtp"
    assert req["headers"]["authkey"] == "widget_auth_key_111"
    assert req["json"]["widgetId"] == "widget_id_999"
    assert req["json"]["identifier"] == "919876543210"

    # Verify SMS test
    captured_requests.clear()
    verified = provider.verify_widget_otp("req_widget_abc123", "654321")
    assert verified is True
    assert len(captured_requests) == 1
    req2 = captured_requests[0]
    assert req2["url"] == "https://api.msg91.com/api/v5/widget/verifyOtp"
    assert req2["json"]["widgetId"] == "widget_id_999"
    assert req2["json"]["reqId"] == "req_widget_abc123"
    assert req2["json"]["otp"] == "654321"


def test_dedicated_email_otp_endpoints(client):
    # 1. Send Email OTP
    send_res = client.post("/api/v1/auth/send-email-otp", json={"email": "doc.dedicated@meyveda.com"})
    assert send_res.status_code == 200
    send_data = send_res.json()
    assert send_data["success"] is True
    assert send_data["target"] == "doc.dedicated@meyveda.com"
    otp_code = send_data["demo_otp"]
    assert otp_code is not None

    # 2. Verify with valid code
    verify_res = client.post("/api/v1/auth/verify-email-otp", json={"email": "doc.dedicated@meyveda.com", "otp": otp_code})
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["success"] is True
    assert verify_data["verified"] is True
    assert verify_data["verification_token"] is not None


def test_dedicated_sms_otp_endpoints(client):
    # 1. Send SMS OTP
    send_res = client.post("/api/v1/auth/send-sms-otp", json={"mobile": "9876543210"})
    assert send_res.status_code == 200
    send_data = send_res.json()
    assert send_data["success"] is True
    assert "9876543210" in send_data["target"]
    otp_code = send_data["demo_otp"]
    assert otp_code is not None

    # 2. Verify with valid code
    verify_res = client.post("/api/v1/auth/verify-sms-otp", json={"mobile": "9876543210", "otp": otp_code})
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["success"] is True
    assert verify_data["verified"] is True
    assert verify_data["verification_token"] is not None



