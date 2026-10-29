"""
Unified OTP Service facade.
Delegates to dedicated email and SMS OTP service implementations:
- app.services.email_otp_service (Zoho CPaaS / ZeptoMail)
- app.services.sms_otp_service (MSG91 SMS / Widget)
"""

from typing import Literal

from app.services.email_otp_service import (
    BaseEmailProvider,
    EmailOtpService,
    MockConsoleEmailProvider,
    ZohoCpaasEmailProvider,
    email_otp_service,
)
from app.services.sms_otp_service import (
    BaseSmsProvider,
    MockConsoleSmsProvider,
    Msg91SmsProvider,
    Msg91WidgetProvider,
    SmsOtpService,
    normalize_phone,
    sms_otp_service,
)

Channel = Literal["email", "sms"]


class UnifiedOtpService:
    def __init__(self):
        self.email = email_otp_service
        self.sms = sms_otp_service

    def send_otp(self, target: str, channel: Channel) -> dict[str, any]:
        if channel == "email":
            return self.email.send_email_otp(target)
        return self.sms.send_sms_otp(target)

    def verify_otp(self, target: str, code: str) -> dict[str, any]:
        if "@" in target:
            return self.email.verify_email_otp(target, code)
        return self.sms.verify_sms_otp(target, code)

    def create_verification_token(self, target: str) -> str:
        if "@" in target:
            return self.email.create_verification_token(target)
        return self.sms.create_verification_token(target)

    def validate_verification_token(self, target: str, token: str) -> bool:
        if "@" in target:
            return self.email.validate_verification_token(target, token)
        return self.sms.validate_verification_token(target, token)


otp_service = UnifiedOtpService()

__all__ = [
    "Channel",
    "otp_service",
    "UnifiedOtpService",
    "email_otp_service",
    "EmailOtpService",
    "ZohoCpaasEmailProvider",
    "MockConsoleEmailProvider",
    "sms_otp_service",
    "SmsOtpService",
    "Msg91WidgetProvider",
    "Msg91SmsProvider",
    "MockConsoleSmsProvider",
    "normalize_phone",
]
