import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure .env is explicitly loaded into os.environ
load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "MeyVeda Platform Backend"
    ENVIRONMENT: str = "production"
    API_V1_STR: str = "/api/v1"
    JWT_SECRET_KEY: str = "meyveda-secure-jwt-secret-key-ayurveda-platform-2026-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = "postgresql+psycopg://postgres:Cheeka%4000@localhost:5432/meyveda_db"
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8000",
    ]

    # Zoho CPaaS / ZeptoMail
    ZOHO_CPAAS_URL: str = "https://cpaas.zoho.in/v1.1/email"
    ZOHO_CPAAS_API_KEY: str | None = None
    ZOHO_CPAAS_FROM_EMAIL: str | None = None
    ZOHO_CPAAS_FROM_NAME: str = "Meyveda"

    # MSG91 SMS
    MSG91_AUTH_KEY: str | None = None
    MSG91_WIDGET_ID: str | None = None
    MSG91_OTP_TEMPLATE_ID: str | None = None
    MSG91_OTP_URL: str = "https://control.msg91.com/api/v5/otp"
    MSG91_WIDGET_URL: str = "https://api.msg91.com/api/v5/widget"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
