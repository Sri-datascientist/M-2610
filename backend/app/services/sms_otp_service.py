import hashlib
import logging
import os
import re
import secrets
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    clean = (
        phone.strip()
        .replace("+", "")
        .replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )
    if len(clean) == 10 and clean[0] in "6789":
        clean = f"91{clean}"
    return clean


class SmsOtpSession:
    def __init__(
        self,
        mobile: str,
        code: str,
        ttl_seconds: int = 300,
        req_id: str | None = None,
        provider_type: str = "internal",
    ):
        self.mobile = normalize_phone(mobile)
        self.salt = secrets.token_hex(8)
        self.hashed_code = self._hash(code, self.salt)
        self.created_at = datetime.now(timezone.utc)
        self.expires_at = self.created_at + timedelta(seconds=ttl_seconds)
        self.attempts_remaining = 3
        self.last_sent_at = self.created_at
        self.req_id = req_id
        self.provider_type = provider_type

    @staticmethod
    def _hash(code: str, salt: str) -> str:
        return hashlib.sha256(f"{salt}:{code}".encode("utf-8")).hexdigest()

    def verify(self, code: str) -> bool:
        return self._hash(code, self.salt) == self.hashed_code

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at


class BaseSmsProvider:
    last_error: str | None = None

    def send_sms(self, phone: str, otp_code: str) -> bool:
        raise NotImplementedError


class MockConsoleSmsProvider(BaseSmsProvider):
    """
    Default safe provider for local development, staging, and automated test environments.
    Simulates delivery without outbound network costs or leaking secrets to public logs.
    """
    def send_sms(self, phone: str, otp_code: str) -> bool:
        clean = normalize_phone(phone)
        masked = clean[:4] + "******" + clean[-2:] if len(clean) >= 6 else "****"
        logger.info("Mock Provider: SMS OTP dispatched to %s", masked)
        return True


class Msg91WidgetProvider(BaseSmsProvider):
    """
    Production SMS provider using MSG91 OTP Widget API.
    Bypasses the requirement for individual Government DLT entity/template registration in India.
    Docs: https://docs.msg91.com/otp-widget/send-otp-1.openapi.yml
    Endpoint: POST https://api.msg91.com/api/v5/widget/sendOtp
    """
    def __init__(self, authkey: str, widget_id: str):
        self.authkey = authkey.strip()
        self.widget_id = widget_id.strip()
        self.send_endpoint = os.getenv("MSG91_WIDGET_SEND_URL", "https://api.msg91.com/api/v5/widget/sendOtp")
        self.verify_endpoint = os.getenv("MSG91_WIDGET_VERIFY_URL", "https://api.msg91.com/api/v5/widget/verifyOtp")
        self.last_error = None
        self.last_req_id = None

    def send_sms(self, phone: str, otp_code: str) -> bool:
        clean_phone = normalize_phone(phone)
        masked_phone = clean_phone[:4] + "******" + clean_phone[-2:] if len(clean_phone) >= 6 else "****"
        payload = {
            "widgetId": self.widget_id,
            "identifier": clean_phone,
        }
        headers = {
            "authkey": self.authkey,
            "Content-Type": "application/json",
            "accept": "application/json",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(self.send_endpoint, json=payload, headers=headers)
            
            data = resp.json() if "application/json" in resp.headers.get("content-type", "") else {}
            if resp.status_code == 200 and data.get("type") == "success":
                self.last_req_id = str(data.get("message"))
                self.last_error = None
                logger.info(
                    "MSG91 Widget OTP dispatched successfully to %s (req_id: %s).",
                    masked_phone,
                    self.last_req_id,
                )
                return True

            err_msg = data.get("message") or resp.text
            self.last_error = f"{err_msg} (status: {resp.status_code})"
            logger.error("MSG91 Widget OTP dispatch failed for %s: %s", masked_phone, self.last_error)
            return False
        except Exception as exc:
            self.last_error = str(exc)
            logger.error("MSG91 Widget OTP exception for %s: %s", masked_phone, exc)
            return False

    def verify_widget_otp(self, req_id: str, code: str) -> bool:
        payload = {
            "widgetId": self.widget_id,
            "reqId": req_id,
            "otp": code.strip(),
        }
        headers = {
            "authkey": self.authkey,
            "Content-Type": "application/json",
            "accept": "application/json",
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(self.verify_endpoint, json=payload, headers=headers)
            data = resp.json() if "application/json" in resp.headers.get("content-type", "") else {}
            if resp.status_code == 200 and data.get("type") == "success":
                self.last_error = None
                return True
            self.last_error = data.get("message") or resp.text
            return False
        except Exception as exc:
            self.last_error = str(exc)
            return False


class Msg91SmsProvider(BaseSmsProvider):
    """
    Production SMS provider using MSG91 SendOTP API (requires approved DLT template).
    Docs: https://docs.msg91.com/otp/sendotp.openapi.yml
    Endpoint: POST https://control.msg91.com/api/v5/otp
    """
    def __init__(self, authkey: str, template_id: str):
        self.authkey = authkey.strip()
        self.template_id = template_id.strip()
        self.endpoint = os.getenv("MSG91_OTP_URL", "https://control.msg91.com/api/v5/otp")
        self.last_error = None

    def send_sms(self, phone: str, otp_code: str) -> bool:
        clean_phone = normalize_phone(phone)
        params = {
            "template_id": self.template_id,
            "mobile": clean_phone,
            "otp": otp_code,
            "otp_expiry": "5",
            "otp_length": str(len(otp_code)),
            "realTimeResponse": "1",
        }
        headers = {
            "authkey": self.authkey,
            "Content-Type": "application/json",
            "accept": "application/json",
        }
        body = {
            "otp": otp_code,
            "company": "Meyveda",
        }

        masked_phone = clean_phone[:4] + "******" + clean_phone[-2:] if len(clean_phone) >= 6 else "****"
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(self.endpoint, params=params, json=body, headers=headers)
            
            data = resp.json() if "application/json" in resp.headers.get("content-type", "") else {}
            is_success = resp.status_code == 200 and data.get("type") != "error"

            if is_success:
                self.last_error = None
                logger.info(
                    "MSG91 OTP SMS dispatched successfully to %s (request_id: %s).",
                    masked_phone,
                    data.get("request_id"),
                )
                return True
            
            err_msg = data.get("message") or resp.text
            self.last_error = f"{err_msg} (status: {resp.status_code})"
            logger.error(
                "MSG91 OTP SMS delivery failed for %s with status %s: %s",
                masked_phone,
                resp.status_code,
                err_msg,
            )
            return False
        except Exception as exc:
            self.last_error = str(exc)
            logger.error("MSG91 SMS request exception for %s: %s", masked_phone, exc)
            return False


class SmsOtpService:
    def __init__(self):
        self._lock = threading.Lock()
        self._sessions: dict[str, SmsOtpSession] = {}
        self._cooldown_seconds = 60
        self._ttl_seconds = 300  # 5 minutes

    def _get_provider(self) -> BaseSmsProvider:
        env_file = Path(__file__).resolve().parent.parent.parent / ".env"
        load_dotenv(env_file, override=True)
        msg91_auth = os.getenv("MSG91_AUTH_KEY") or settings.MSG91_AUTH_KEY
        msg91_widget = os.getenv("MSG91_WIDGET_ID") or getattr(settings, "MSG91_WIDGET_ID", None)
        msg91_template = os.getenv("MSG91_OTP_TEMPLATE_ID") or settings.MSG91_OTP_TEMPLATE_ID

        # Priority 1: MSG91 OTP Widget (NO Government DLT registration or custom template needed!)
        if msg91_auth and msg91_widget:
            return Msg91WidgetProvider(msg91_auth, msg91_widget)

        # Priority 2: MSG91 SendOTP API (requires approved DLT template)
        if msg91_auth and msg91_template:
            return Msg91SmsProvider(msg91_auth, msg91_template)

        logger.warning("MSG91 credentials not configured in environment. Using MockConsoleSmsProvider.")
        return MockConsoleSmsProvider()

    def send_sms_otp(self, mobile: str) -> dict[str, any]:
        digits = re.sub(r"\D", "", mobile or "")
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        elif len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]

        if len(digits) != 10 or digits[0] not in "6789":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
            )
        if len(set(digits)) == 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mobile number cannot consist of identical repeated digits.",
            )

        clean_mobile = f"91{digits}"
        now = datetime.now(timezone.utc)

        with self._lock:
            existing = self._sessions.get(clean_mobile)
            if existing and not existing.is_expired():
                elapsed = (now - existing.last_sent_at).total_seconds()
                if elapsed < self._cooldown_seconds:
                    remaining = int(self._cooldown_seconds - elapsed)
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Please wait {remaining} seconds before requesting a new SMS verification code.",
                    )

            code = f"{secrets.randbelow(900000) + 100000:06d}"
            session = SmsOtpSession(clean_mobile, code, ttl_seconds=self._ttl_seconds)
            self._sessions[clean_mobile] = session

        provider = self._get_provider()
        dispatched = provider.send_sms(clean_mobile, code)
        last_err = getattr(provider, "last_error", None)

        if isinstance(provider, Msg91WidgetProvider) and provider.last_req_id:
            session.req_id = provider.last_req_id
            session.provider_type = "msg91_widget"

        is_prod = (settings.ENVIRONMENT or os.getenv("ENVIRONMENT", "development")).lower() == "production"
        if not dispatched and is_prod:
            err_suffix = f": {last_err}" if last_err else ". Please check MSG91 gateway configuration."
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to dispatch verification code via SMS gateway{err_suffix}",
            )

        return {
            "success": True,
            "message": f"Verification code dispatched to {clean_mobile}",
            "target": clean_mobile,
            "demo_otp": None if is_prod else code,
            "expires_in": self._ttl_seconds,
        }

    def verify_sms_otp(self, mobile: str, code: str) -> dict[str, any]:
        clean_mobile = normalize_phone(mobile)
        clean_code = code.strip()

        with self._lock:
            session = self._sessions.get(clean_mobile)
            if not session:
                is_dev = os.getenv("ENVIRONMENT", "development").lower() != "production"
                if is_dev and clean_code == "123456":
                    token = self.create_verification_token(clean_mobile)
                    return {
                        "success": True,
                        "verified": True,
                        "message": "SMS verification accepted (Dev Mode).",
                        "verification_token": token,
                    }
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No active SMS verification session found. Please request a new code.",
                )

            if session.is_expired():
                del self._sessions[clean_mobile]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="SMS verification code has expired. Please request a new code.",
                )

            # Verification check: Local session code match OR external MSG91 Widget API
            is_valid = False
            if session.verify(clean_code):
                is_valid = True
            elif session.provider_type == "msg91_widget" and session.req_id:
                provider = self._get_provider()
                if isinstance(provider, Msg91WidgetProvider):
                    is_valid = provider.verify_widget_otp(session.req_id, clean_code)
                else:
                    is_valid = False
            else:
                is_valid = False

            if not is_valid:
                session.attempts_remaining -= 1
                if session.attempts_remaining <= 0:
                    del self._sessions[clean_mobile]
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Maximum verification attempts exceeded. Code has been invalidated.",
                    )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid verification code. {session.attempts_remaining} attempts remaining.",
                )

            del self._sessions[clean_mobile]

        token = self.create_verification_token(clean_mobile)
        return {
            "success": True,
            "verified": True,
            "message": "Mobile number verified successfully.",
            "verification_token": token,
        }

    @staticmethod
    def create_verification_token(mobile: str) -> str:
        secret = settings.JWT_SECRET_KEY
        payload = {
            "sub": normalize_phone(mobile),
            "purpose": "registration_verification",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        }
        return jwt.encode(payload, secret, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def validate_verification_token(mobile: str, token: str) -> bool:
        secret = settings.JWT_SECRET_KEY
        try:
            payload = jwt.decode(token, secret, algorithms=[settings.JWT_ALGORITHM])
            return payload.get("sub") == normalize_phone(mobile) and payload.get("purpose") == "registration_verification"
        except Exception:
            return False


sms_otp_service = SmsOtpService()
