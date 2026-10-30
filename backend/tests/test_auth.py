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
from databases.schema.models import User, Doctor, Manufacturer, Referral, ColleagueInvitation

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
        "invite_code": "MEY26",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "doctor.test@example.com"
    assert data["role"] == "doctor"
    assert "password" not in data
    assert "hashed_password" not in data


def test_doctor_registration_compulsory_invite_code(client):
    # 1. Missing invite code fails
    payload_no_invite = {
        "email": "noinvite@example.com",
        "password": "Password123!",
        "role": "doctor",
        "full_name_or_company": "Dr. No Invite",
        "medical_license_or_contact_name": "MED-NOINVITE-1",
        "specialty_or_contact_email": "Ayurveda",
    }
    res1 = client.post("/api/v1/auth/register", json=payload_no_invite)
    assert res1.status_code == 400
    assert "Invite code is compulsory" in res1.json()["detail"]

    # 2. Invalid invite code fails
    payload_bad_invite = {
        **payload_no_invite,
        "email": "badinvite@example.com",
        "medical_license_or_contact_name": "MED-BADINVITE-1",
        "invite_code": "ZZZ99",
    }
    res2 = client.post("/api/v1/auth/register", json=payload_bad_invite)
    assert res2.status_code == 400
    assert "Invalid invite code" in res2.json()["detail"]

    # 3. Valid invite code succeeds
    payload_good_invite = {
        **payload_no_invite,
        "email": "goodinvite@example.com",
        "medical_license_or_contact_name": "MED-GOODINVITE-1",
        "invite_code": "MEY26",
    }
    res3 = client.post("/api/v1/auth/register", json=payload_good_invite)
    assert res3.status_code == 201
    assert res3.json()["email"] == "goodinvite@example.com"


def test_duplicate_email_registration_rejected(client):
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "role": "doctor",
        "full_name_or_company": "Dr. First",
        "medical_license_or_contact_name": "MED-111111",
        "specialty_or_contact_email": "General",
        "invite_code": "MEY26",
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
        "invite_code": "MEY26",
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
        "invite_code": "MEY26",
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
        "invite_code": "MEY26",
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
        "invite_code": "MEY26",
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
        "invite_code": "MEY26",
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


# ============================================================================
# REFERRAL / INVITE CODE COMPLETION & IDEMPOTENCY TESTS
# ============================================================================

def test_registration_with_existing_referral_updates_status_and_awards_points(client, db_session):
    """
    Scenario: A doctor invites a colleague (creates a submitted referral record).
    The colleague then registers using the doctor's invite code.
    Verification:
    - Existing referral is updated to status='completed' (NO duplicate inserted).
    - Exactly 1 referral record exists in DB (preserves uq_doctor_referred_contact).
    - Referral points (10 points) are awarded.
    """
    # 1. Setup referring doctor
    ref_user = User(
        email="referrer.one@meyveda.com",
        hashed_password="HashedPassword123!",
        role="doctor",
        status="active",
    )
    db_session.add(ref_user)
    db_session.flush()

    referrer = Doctor(
        user_id=ref_user.id,
        full_name="Dr. Referrer One",
        medical_license_number="AYUSH-REF-001",
        qualification="BAMS",
        specialty="Ayurveda",
        invite_code="REF10",
        verification_status="approved",
    )
    db_session.add(referrer)
    db_session.flush()

    # 2. Existing submitted referral previously created by referrer
    invited_email = "colleague.one@meyveda.com"
    existing_ref = Referral(
        referring_doctor_id=referrer.id,
        referred_name="Dr. Colleague Pre",
        referred_contact=invited_email,
        reason="Invited for Ayurvedic Clinical Exchange",
        status="submitted",
        score_awarded=0,
    )
    db_session.add(existing_ref)

    # Also add a ColleagueInvitation record to verify it stays in sync
    invitation = ColleagueInvitation(
        referring_doctor_id=referrer.id,
        inviting_doctor_name=referrer.full_name,
        inviting_doctor_qualification=referrer.qualification,
        invite_code=referrer.invite_code,
        colleague_name="Dr. Colleague Pre",
        colleague_email=invited_email,
        colleague_mobile="+91 9988776655",
        qualification="BAMS",
        status="Invitation Sent",
    )
    db_session.add(invitation)
    db_session.commit()

    # 3. Colleague registers using referrer's invite code
    register_payload = {
        "email": invited_email,
        "password": "SecurePassword123!",
        "role": "doctor",
        "full_name": "Dr. Colleague Final",
        "doctor_register_number": "MED-COLLEAGUE-001",
        "qualification": "BAMS",
        "pincode": "600001",
        "phone": "9988776655",
        "invite_code": "REF10",
    }
    resp = client.post("/api/v1/auth/register", json=register_payload)
    assert resp.status_code == 201

    # 4. Verify in DB: Exactly ONE referral record exists (no duplicate)
    refs = db_session.query(Referral).filter(
        Referral.referring_doctor_id == referrer.id,
        Referral.referred_contact == invited_email,
    ).all()
    assert len(refs) == 1, "Duplicate referral was inserted despite existing referral record!"

    updated_ref = refs[0]
    assert updated_ref.status == "completed"
    assert updated_ref.score_awarded == 10
    assert updated_ref.referred_name == "Dr. Colleague Final"
    assert "completed via invite code REF10" in updated_ref.reason

    # Verify ColleagueInvitation updated
    db_session.refresh(invitation)
    assert invitation.status == "Registered"


def test_first_time_registration_without_prior_referral_creates_referral(client, db_session):
    """
    Scenario: A doctor shares their invite code verbally or via external channel.
    The new doctor registers directly without a pre-existing referral row.
    Verification:
    - Referral is created with status='completed' and 10 points.
    - Exactly 1 record in DB.
    """
    ref_user = User(
        email="referrer.two@meyveda.com",
        hashed_password="HashedPassword123!",
        role="doctor",
        status="active",
    )
    db_session.add(ref_user)
    db_session.flush()

    referrer = Doctor(
        user_id=ref_user.id,
        full_name="Dr. Referrer Two",
        medical_license_number="AYUSH-REF-002",
        qualification="BSMS",
        specialty="Siddha",
        invite_code="REF20",
        verification_status="approved",
    )
    db_session.add(referrer)
    db_session.commit()

    direct_email = "direct.signup@meyveda.com"
    register_payload = {
        "email": direct_email,
        "password": "SecurePassword123!",
        "role": "doctor",
        "full_name": "Dr. Direct Signup",
        "doctor_register_number": "MED-DIRECT-002",
        "qualification": "BSMS",
        "pincode": "600002",
        "phone": "9911223344",
        "invite_code": "REF20",
    }
    resp = client.post("/api/v1/auth/register", json=register_payload)
    assert resp.status_code == 201

    refs = db_session.query(Referral).filter(
        Referral.referring_doctor_id == referrer.id,
        Referral.referred_contact == direct_email,
    ).all()
    assert len(refs) == 1
    assert refs[0].status == "completed"
    assert refs[0].score_awarded == 10


def test_repeated_registration_is_idempotent_no_duplicate_referral(client, db_session):
    """
    Scenario: Repeated registration attempts for the same doctor with invite code.
    Verification:
    - First registration succeeds and creates/completes referral (score = 10).
    - Repeated registration attempt returns 409 (duplicate account rejected).
    - Referral table STILL contains exactly 1 referral record for this referring doctor and contact.
    - Referral score is NOT awarded more than once (remains 10, not 20).
    - No UniqueViolation or database error.
    """
    ref_user = User(
        email="referrer.three@meyveda.com",
        hashed_password="HashedPassword123!",
        role="doctor",
        status="active",
    )
    db_session.add(ref_user)
    db_session.flush()

    referrer = Doctor(
        user_id=ref_user.id,
        full_name="Dr. Referrer Three",
        medical_license_number="AYUSH-REF-003",
        qualification="BAMS",
        specialty="Ayurveda",
        invite_code="REF30",
        verification_status="approved",
    )
    db_session.add(referrer)
    db_session.commit()

    repeat_email = "repeat.doc@meyveda.com"
    payload = {
        "email": repeat_email,
        "password": "SecurePassword123!",
        "role": "doctor",
        "full_name": "Dr. Repeat Practitioner",
        "doctor_register_number": "MED-REPEAT-003",
        "qualification": "BAMS",
        "pincode": "411001",
        "phone": "9887766554",
        "invite_code": "REF30",
    }

    # 1. First registration attempt
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    refs1 = db_session.query(Referral).filter(
        Referral.referring_doctor_id == referrer.id,
        Referral.referred_contact == repeat_email,
    ).all()
    assert len(refs1) == 1
    assert refs1[0].status == "completed"
    assert refs1[0].score_awarded == 10

    # 2. Repeated registration attempt with the same email and credentials
    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 409
    assert "already exists" in resp2.json()["detail"]

    # 3. Verify referrals table is completely unchanged and contains only 1 record
    refs2 = db_session.query(Referral).filter(
        Referral.referring_doctor_id == referrer.id,
        Referral.referred_contact == repeat_email,
    ).all()
    assert len(refs2) == 1, "Duplicate referral created on repeated registration attempt!"
    assert refs2[0].score_awarded == 10, "Referral points were awarded more than once!"


def test_referral_points_awarded_only_once_even_if_already_completed(client, db_session):
    """
    Scenario: A referral already had score_awarded >= 10.
    A registration matching that referral runs.
    Verification:
    - Points remain 10 (not added to 20).
    - Status remains completed.
    - No duplicate referral inserted.
    """
    ref_user = User(
        email="referrer.four@meyveda.com",
        hashed_password="HashedPassword123!",
        role="doctor",
        status="active",
    )
    db_session.add(ref_user)
    db_session.flush()

    referrer = Doctor(
        user_id=ref_user.id,
        full_name="Dr. Referrer Four",
        medical_license_number="AYUSH-REF-004",
        qualification="BAMS",
        specialty="Ayurveda",
        invite_code="REF40",
        verification_status="approved",
    )
    db_session.add(referrer)
    db_session.flush()

    contact_email = "precompleted@meyveda.com"
    pre_ref = Referral(
        referring_doctor_id=referrer.id,
        referred_name="Dr. Pre Completed",
        referred_contact=contact_email,
        reason="Pre-existing referral with points already awarded",
        status="completed",
        score_awarded=10,
    )
    db_session.add(pre_ref)
    db_session.commit()

    payload = {
        "email": contact_email,
        "password": "SecurePassword123!",
        "role": "doctor",
        "full_name": "Dr. Pre Completed Final",
        "doctor_register_number": "MED-PRECOMP-004",
        "qualification": "BAMS",
        "pincode": "560001",
        "phone": "9876543211",
        "invite_code": "REF40",
    }
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201

    refs = db_session.query(Referral).filter(
        Referral.referring_doctor_id == referrer.id,
        Referral.referred_contact == contact_email,
    ).all()
    assert len(refs) == 1
    assert refs[0].score_awarded == 10, f"Expected 10 points, got {refs[0].score_awarded}"
    assert refs[0].status == "completed"




