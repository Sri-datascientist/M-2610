import logging
# Trigger Uvicorn reload for settings update
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from functions.dashboards import router as dashboards_router
from functions.journal_ingestion import router as journal_ingestion_router
from databases.adr_reports import router as adr_reports_router
from databases.doctors import router as doctors_router
from databases.feedback import router as feedback_router
from databases.journals import router as journals_router
from databases.library import router as library_router
from databases.manufacturers import router as manufacturers_router
from databases.products import router as products_router
from databases.referrals import router as referrals_router
from databases.franchise import router as franchise_router
from databases.contact import router as contact_router
from databases.research_submissions import router as research_submissions_router
from app.routers.auth import router as auth_router
from app.api.v1.pincode import router as pincode_router
from app.routers.territory import router as territory_router

from app.config import settings
from databases.session import check_db_connection
from databases.seeds.seed_data import seed_database

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables and initial seed data on startup
    try:
        seed_database()
        logger.info("Database initialized and verified.")
    except Exception as exc:
        logger.warning("Database startup initialization notice: %s", exc)
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=getattr(settings, "CORS_ORIGINS", settings.ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Routers
app.include_router(pincode_router, prefix="/api/v1/pincode")
app.include_router(pincode_router, prefix="/api/pincode")
app.include_router(territory_router, prefix="/api/v1/territory")
app.include_router(territory_router, prefix="/api/territory")
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(adr_reports_router)
app.include_router(dashboards_router)
app.include_router(manufacturers_router)
app.include_router(doctors_router)
app.include_router(products_router)
app.include_router(library_router)
app.include_router(journals_router)
app.include_router(journal_ingestion_router)
app.include_router(research_submissions_router)
app.include_router(feedback_router)
app.include_router(referrals_router)
app.include_router(franchise_router, prefix="/api/v1/franchise")
app.include_router(franchise_router, prefix="/api/franchise")
app.include_router(franchise_router, prefix="/api/v1")
app.include_router(franchise_router, prefix="/api")
app.include_router(contact_router, prefix="/api/v1/contact")
app.include_router(contact_router, prefix="/api/contact")

@app.get("/health")
async def health(response: Response):
    db_status = check_db_connection()
    if db_status.get("status") != "connected":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "unhealthy", "project": settings.PROJECT_NAME, "database": db_status}
    return {"status": "ok", "project": settings.PROJECT_NAME, "database": db_status}
