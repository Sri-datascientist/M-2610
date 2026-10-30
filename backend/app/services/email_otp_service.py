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

DISPOSABLE_OR_FAKE_DOMAINS = {
    "fake.com",
    "test.com",
    "dummy.com",
    "sample.com",
    "invalid.com",
    "tempmail.com",
    "mailinator.com",
    "throwawaymail.com",
    "guerrillamail.com",
    "sharklasers.com",
    "yopmail.com",
    "10minutemail.com",
    "trashmail.com",
    "dispostable.com",
    "getairmail.com",
    "mohmal.com",
    "burnermail.io",
    "nada.ltd",
}

EMAIL_RFC_PATTERN = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
)
CONSONANT_RUN_PATTERN = re.compile(r"[bcdfghjklmnpqrstvwxz]{6,}", re.IGNORECASE)
REPEATED_CHAR_PATTERN = re.compile(r"(.)\1{3,}")


def validate_authentic_email(email: str) -> str:
    norm = (email or "").strip().lower()
    if not norm or not EMAIL_RFC_PATTERN.match(norm):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address (e.g. doctor@hospital.org).",
        )
    parts = norm.split("@")
    if len(parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format.",
        )
    local_part, domain = parts
    domain_parts = domain.split(".")
    tld = domain_parts[-1]
    if len(tld) < 2 or not tld.isalpha():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address has an invalid domain extension.",
        )
    if domain in DISPOSABLE_OR_FAKE_DOMAINS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Disposable, fake, or temporary email domains are not accepted.",
        )
    alpha_chars = "".join([c for c in local_part if c.isalpha()])
    if len(alpha_chars) >= 5:
        vowel_count = sum(1 for c in alpha_chars if c in "aeiouy")
        if vowel_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter a valid, deliverable email address (keyboard mashing detected).",
            )
    if CONSONANT_RUN_PATTERN.search(local_part):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a realistic email address (unusual consonant sequence detected).",
        )
    if REPEATED_CHAR_PATTERN.search(local_part):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address contains excessive repeated characters.",
        )
    return norm


class EmailOtpSession:
    def __init__(self, email: str, code: str, ttl_seconds: int = 300):
        self.email = email.strip().lower()
        self.salt = secrets.token_hex(8)
        self.hashed_code = self._hash(code, self.salt)
        self.created_at = datetime.now(timezone.utc)
        self.expires_at = self.created_at + timedelta(seconds=ttl_seconds)
        self.attempts_remaining = 3
        self.last_sent_at = self.created_at

    @staticmethod
    def _hash(code: str, salt: str) -> str:
        return hashlib.sha256(f"{salt}:{code}".encode("utf-8")).hexdigest()

    def verify(self, code: str) -> bool:
        return self._hash(code, self.salt) == self.hashed_code

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at


class BaseEmailProvider:
    last_error: str | None = None

    def send_email(self, email: str, otp_code: str) -> bool:
        raise NotImplementedError

    def send_custom_email(self, email: str, subject: str, html_body: str, to_name: str = "Doctor") -> bool:
        raise NotImplementedError


class MockConsoleEmailProvider(BaseEmailProvider):
    """
    Default safe provider for local development, staging, and automated test environments.
    Simulates delivery without outbound network costs or leaking secrets to public logs.
    """
    def send_email(self, email: str, otp_code: str) -> bool:
        parts = email.split("@")
        masked = parts[0][:2] + "***@" + parts[1] if len(parts) == 2 else "***"
        logger.info("Mock Provider: Email OTP dispatched to %s", masked)
        return True

    def send_custom_email(self, email: str, subject: str, html_body: str, to_name: str = "Doctor") -> bool:
        parts = email.split("@")
        masked = parts[0][:2] + "***@" + parts[1] if len(parts) == 2 else "***"
        logger.info("Mock Provider: Email '%s' dispatched to %s (%s)", subject, masked, to_name)
        return True


class ZohoCpaasEmailProvider(BaseEmailProvider):
    """
    Production Email provider using Zoho CPaaS / ZeptoMail REST API.
    Endpoint: https://cpaas.zoho.in/v1.1/email
    Header:
      Authorization: Zoho-enczapikey <API_KEY>
    """
    def __init__(self, api_key: str, from_address: str, from_name: str = "Meyveda"):
        clean_key = api_key.strip()
        if not clean_key.startswith("Zoho-enczapikey "):
            clean_key = f"Zoho-enczapikey {clean_key}"
        self.auth_header = clean_key
        self.from_address = from_address
        self.from_name = from_name
        self.endpoint = os.getenv("ZOHO_CPAAS_URL", "https://cpaas.zoho.in/v1.1/email")
        self.last_error = None

    def send_email(self, email: str, otp_code: str) -> bool:
        html_body = (
            f"<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;'>"
            f"<div style='text-align: center; margin-bottom: 20px;'>"
            f"<h2 style='color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;'>Meyveda Platform</h2>"
            f"<p style='color: #64748b; font-size: 13px; margin-top: 4px;'>Ayurvedic Clinical Pharmacovigilance & Research</p>"
            f"</div>"
            f"<div style='padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin-bottom: 20px;'>"
            f"<p style='color: #334155; font-size: 14px; margin: 0 0 12px 0;'>Your verification code is:</p>"
            f"<div style='font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ea580c; font-family: monospace;'>{otp_code}</div>"
            f"<p style='color: #94a3b8; font-size: 12px; margin: 12px 0 0 0;'>Valid for 5 minutes. Do not share this code.</p>"
            f"</div>"
            f"<p style='color: #64748b; font-size: 12px; line-height: 1.6; margin: 0;'>"
            f"If you did not request this verification code, please ignore this email or contact support at support@meyveda.com."
            f"</p>"
            f"<hr style='border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;' />"
            f"<p style='color: #94a3b8; font-size: 11px; text-align: center; margin: 0;'>© 2026 Meyveda. All rights reserved.</p>"
            f"</div>"
        )
        return self.send_custom_email(
            email=email,
            subject=f"Your Meyveda Verification Code: {otp_code}",
            html_body=html_body,
            to_name="Doctor",
        )

    def send_custom_email(self, email: str, subject: str, html_body: str, to_name: str = "Doctor") -> bool:
        payload = {
            "from": {"address": self.from_address, "name": self.from_name},
            "to": [{"email_address": {"address": email.strip().lower(), "name": to_name}}],
            "subject": subject,
            "htmlbody": html_body,
        }
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": self.auth_header,
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(self.endpoint, json=payload, headers=headers)
            if resp.status_code in (200, 201):
                self.last_error = None
                logger.info("Zoho CPaaS email '%s' dispatched successfully to %s.", subject, email)
                return True
            self.last_error = f"{resp.text} (status: {resp.status_code})"
            logger.error("Zoho CPaaS email dispatch failed with status %s: %s", resp.status_code, resp.text)
            return False
        except Exception as exc:
            self.last_error = str(exc)
            logger.error("Zoho CPaaS email request exception: %s", exc)
            return False


class EmailOtpService:
    def __init__(self):
        self._lock = threading.Lock()
        self._sessions: dict[str, EmailOtpSession] = {}
        self._cooldown_seconds = 60
        self._ttl_seconds = 300  # 5 minutes

    def _get_provider(self) -> BaseEmailProvider:
        env_file = Path(__file__).resolve().parent.parent.parent / ".env"
        load_dotenv(env_file, override=True)
        zoho_key = os.getenv("ZOHO_CPAAS_API_KEY") or settings.ZOHO_CPAAS_API_KEY
        zoho_from = os.getenv("ZOHO_CPAAS_FROM_EMAIL") or settings.ZOHO_CPAAS_FROM_EMAIL or os.getenv("SENDER_EMAIL")
        zoho_name = os.getenv("ZOHO_CPAAS_FROM_NAME") or settings.ZOHO_CPAAS_FROM_NAME or "Meyveda"
        if zoho_key and zoho_from:
            return ZohoCpaasEmailProvider(zoho_key, zoho_from, zoho_name)
        logger.warning("Zoho CPaaS credentials not configured in environment. Using MockConsoleEmailProvider.")
        return MockConsoleEmailProvider()

    def send_email_otp(self, email: str) -> dict[str, any]:
        norm_email = validate_authentic_email(email)
        now = datetime.now(timezone.utc)

        with self._lock:
            existing = self._sessions.get(norm_email)
            if existing and not existing.is_expired():
                elapsed = (now - existing.last_sent_at).total_seconds()
                if elapsed < self._cooldown_seconds:
                    remaining = int(self._cooldown_seconds - elapsed)
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Please wait {remaining} seconds before requesting a new verification code.",
                    )

            code = f"{secrets.randbelow(900000) + 100000:06d}"
            session = EmailOtpSession(norm_email, code, ttl_seconds=self._ttl_seconds)
            self._sessions[norm_email] = session

        provider = self._get_provider()
        dispatched = provider.send_email(norm_email, code)
        last_err = getattr(provider, "last_error", None)

        is_prod = (settings.ENVIRONMENT or os.getenv("ENVIRONMENT", "development")).lower() == "production"
        is_mock = isinstance(provider, MockConsoleEmailProvider)
        if not dispatched and is_prod and not is_mock:
            err_suffix = f": {last_err}" if last_err else ". Please check Zoho CPaaS configuration."
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to dispatch verification code via email gateway{err_suffix}",
            )

        return {
            "success": True,
            "message": f"Verification code dispatched to {email}",
            "target": email,
            "demo_otp": code if (not is_prod or is_mock) else None,
            "expires_in": self._ttl_seconds,
        }

    def verify_email_otp(self, email: str, code: str) -> dict[str, any]:
        norm_email = email.strip().lower()
        clean_code = code.strip()

        with self._lock:
            session = self._sessions.get(norm_email)
            if not session:
                is_dev = os.getenv("ENVIRONMENT", "development").lower() != "production"
                is_mock = isinstance(self._get_provider(), MockConsoleEmailProvider)
                if (is_dev or is_mock) and clean_code == "123456":
                    token = self.create_verification_token(norm_email)
                    return {
                        "success": True,
                        "verified": True,
                        "message": "Email verification accepted (Dev Mode).",
                        "verification_token": token,
                    }
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No active verification session found. Please request a new email code.",
                )

            if session.is_expired():
                del self._sessions[norm_email]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email verification code has expired. Please request a new code.",
                )

            if not session.verify(clean_code):
                session.attempts_remaining -= 1
                if session.attempts_remaining <= 0:
                    del self._sessions[norm_email]
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Maximum verification attempts exceeded. Code has been invalidated.",
                    )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid verification code. {session.attempts_remaining} attempts remaining.",
                )

            del self._sessions[norm_email]

        token = self.create_verification_token(norm_email)
        return {
            "success": True,
            "verified": True,
            "message": "Email address verified successfully.",
            "verification_token": token,
        }

    @staticmethod
    def create_verification_token(email: str) -> str:
        secret = settings.JWT_SECRET_KEY
        payload = {
            "sub": email.strip().lower(),
            "purpose": "registration_verification",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        }
        return jwt.encode(payload, secret, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def validate_verification_token(email: str, token: str) -> bool:
        secret = settings.JWT_SECRET_KEY
        try:
            payload = jwt.decode(token, secret, algorithms=[settings.JWT_ALGORITHM])
            return payload.get("sub") == email.strip().lower() and payload.get("purpose") == "registration_verification"
        except Exception:
            return False

    def send_colleague_invitation(
        self,
        colleague_name: str,
        colleague_email: str,
        colleague_mobile: str,
        colleague_qualification: str,
        inviter_name: str,
        inviter_qualification: str,
        invite_code: str,
        app_url: str = "http://localhost:3000",
    ) -> dict[str, any]:
        import urllib.parse
        clean_email = colleague_email.strip().lower()
        clean_name = colleague_name.strip()
        clean_mobile = colleague_mobile.strip()
        clean_qual = colleague_qualification.strip() or "BAMS"
        clean_inviter = inviter_name.strip()
        clean_inviter_qual = inviter_qualification.strip() or "Vaidya"

        # Build direct registration link prefilled with all 4 parameters + invite code
        query_params = urllib.parse.urlencode({
            "ref": invite_code,
            "name": clean_name,
            "email": clean_email,
            "mobile": clean_mobile,
            "qualification": clean_qual,
        })
        base_clean = app_url.rstrip("/")
        registration_url = f"{base_clean}/register?{query_params}"

        subject = f"Dr. {clean_inviter} has invited you to join Meyveda — AYUSH Early Access"

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FAF9F6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #EBE7DF; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #FAF7F2; padding: 28px 32px; border-bottom: 2px solid #E67230; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #111111; letter-spacing: -0.5px;">
                mey<span style="color: #E67230;">veda</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #777777; font-weight: 600;">
                Ancient Wisdom · Modern Practice · Clinical Intelligence
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <div style="background-color: #FFF7ED; border-left: 4px solid #E67230; padding: 14px 18px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #9A3412; font-weight: 600;">
                  Personal Invitation from Dr. {clean_inviter} ({clean_inviter_qual})
                </p>
              </div>

              <p style="font-size: 16px; font-weight: 700; color: #111111; margin: 0 0 16px 0;">
                Dear Dr. {clean_name},
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #444444; margin: 0 0 16px 0;">
                Your friend and esteemed colleague, <strong>Dr. {clean_inviter}</strong>, has personally nominated you for early access to <strong>Meyveda</strong> — India's premier digital platform and clinical desk dedicated to verified AYUSH medical practitioners.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #444444; margin: 0 0 20px 0;">
                As a recognized <strong>{clean_qual}</strong> practitioner, you are invited to join an exclusive, peer-vetted community advancing clinical excellence, research integrity, and modern AYUSH governance.
              </p>

              <!-- Features Box -->
              <div style="background-color: #FAF9F6; border: 1px solid #EBE7DF; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 14px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #555555; font-weight: 700;">
                  What Awaits You Inside Meyveda:
                </h3>

                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom: 12px; vertical-align: top; width: 24px; font-size: 16px;">🌿</td>
                    <td style="padding-bottom: 12px; font-size: 13px; line-height: 1.5; color: #333333; padding-left: 8px;">
                      <strong>Classical Grantha &amp; Shloka Intelligence:</strong> Search authentic samhita citations across Charaka, Sushruta, and Ashtanga Hridaya with clinical commentary.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 12px; vertical-align: top; width: 24px; font-size: 16px;">📋</td>
                    <td style="padding-bottom: 12px; font-size: 13px; line-height: 1.5; color: #333333; padding-left: 8px;">
                      <strong>AYUSH Medicine Intelligence &amp; Pharmacovigilance:</strong> Access verified Form 25D formulations, batch standards, and report ADRs with complete clinical privacy.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 12px; vertical-align: top; width: 24px; font-size: 16px;">🏛</td>
                    <td style="padding-bottom: 12px; font-size: 13px; line-height: 1.5; color: #333333; padding-left: 8px;">
                      <strong>Seamless Statutory Council Lookup:</strong> Automatic territory mapping across all 28 Indian States and 8 Union Territories aligned with NCISM &amp; State Councils.
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align: top; width: 24px; font-size: 16px;">🤝</td>
                    <td style="font-size: 13px; line-height: 1.5; color: #333333; padding-left: 8px;">
                      <strong>Closed Peer Network:</strong> 100% closed, non-commercial clinical peer exchange — no spam, ads, or retail distractions.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Invite Code Highlight -->
              <div style="text-align: center; background: #FAF7F2; border: 2px dashed #E67230; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #777777; font-weight: 700;">
                  Your Exclusive Colleague Invite Code
                </p>
                <div style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #E67230; font-family: monospace; margin: 4px 0 8px 0;">
                  {invite_code}
                </div>
                <p style="margin: 0; font-size: 12px; color: #666666;">
                  Registration is currently by invitation only. This code guarantees verified entry.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="{registration_url}" target="_blank" style="display: inline-block; background-color: #E67230; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(230, 114, 48, 0.35); text-transform: none;">
                  Accept Invitation &amp; Register Account →
                </a>
                <p style="margin: 10px 0 0 0; font-size: 11px; color: #888888;">
                  ✨ Clicking above automatically applies your code and pre-fills your details.
                </p>
              </div>

              <!-- Plain link fallback -->
              <div style="border-top: 1px solid #EBE7DF; padding-top: 16px; margin-bottom: 16px;">
                <p style="margin: 0 0 6px 0; font-size: 11px; color: #888888;">
                  Button not working? Copy and paste this URL into your browser:
                </p>
                <p style="margin: 0; font-size: 11px; word-break: break-all; color: #E67230; font-family: monospace;">
                  {registration_url}
                </p>
              </div>

              <!-- Sign-off -->
              <p style="font-size: 13px; line-height: 1.5; color: #555555; margin: 20px 0 0 0;">
                Warm regards,<br>
                <strong>Dr. {clean_inviter}</strong> &amp; The Meyveda Clinical Onboarding Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF9F6; padding: 20px 32px; border-top: 1px solid #EBE7DF; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #888888;">
                © 2026 Meyveda. Reinvent You · All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #999999;">
                Need assistance? Reach out to our verification desk at <a href="mailto:support@meyveda.com" style="color: #E67230; text-decoration: none;">support@meyveda.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        provider = self._get_provider()
        dispatched = provider.send_custom_email(
            email=clean_email,
            subject=subject,
            html_body=html_body,
            to_name=f"Dr. {clean_name}",
        )

        return {
            "success": True,
            "dispatched": dispatched,
            "email": clean_email,
            "invite_code": invite_code,
            "registration_url": registration_url,
            "subject": subject,
        }



email_otp_service = EmailOtpService()
