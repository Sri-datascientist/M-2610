import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config import settings
from app.auth import create_access_token
from databases.session import Base, get_db
from databases.schema.models import User, Journal, JournalIngestionRun, AuditHistory

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
def admin_token():
    return create_access_token(user_id="admin-j-1", role="admin")


@pytest.fixture
def doctor_token():
    return create_access_token(user_id="doc-j-1", role="doctor")


def test_admin_create_and_update_journal(client, admin_token, db_session):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "title": "Phytochemical Screening and Therapeutic Potential of Curcuma longa",
        "authors": ["Vaidya R. K.", "Dr. P. Sen"],
        "journal_name": "Journal of Ethnopharmacology and Ayurvedic Medicine",
        "publication_date": str(date(2023, 6, 15)),
        "doi": "10.1016/j.jep.2023.109888",
        "url": "https://example.com/journals/curcuma-study",
        "abstract": "Curcuminoids demonstrate profound cellular protective pathways in inflammatory models.",
    }
    response = client.post("/api/v1/admin/journals", json=payload, headers=headers)
    assert response.status_code == 201
    journal_id = response.json()["id"]
    assert response.json()["doi"] == payload["doi"]

    # Duplicate DOI check -> 409 Conflict
    dup_res = client.post("/api/v1/admin/journals", json=payload, headers=headers)
    assert dup_res.status_code == 409
    assert "already exists" in dup_res.json()["detail"]

    # Update journal
    update_res = client.patch(
        f"/api/v1/admin/journals/{journal_id}",
        json={"title": "Updated: Phytochemical Screening and Therapeutic Potential of Curcuma longa"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert "Updated:" in update_res.json()["title"]


def test_public_browse_and_deactivation(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin creates article
    create_res = client.post(
        "/api/v1/admin/journals",
        json={
            "title": "Anti-inflammatory Action of Boswellia serrata",
            "authors": ["Dr. M. K. Roy"],
            "journal_name": "Phytomedicine Reports",
            "publication_date": str(date(2022, 1, 10)),
            "doi": "10.1016/j.phymed.2022.010101",
            "url": "https://example.com/journals/boswellia",
            "abstract": "Boswellic acids show 5-LOX inhibitory activity in vitro.",
        },
        headers=headers,
    )
    j_id = create_res.json()["id"]

    # Public browse returns the article
    public_res = client.get("/api/v1/journals?search=Boswellia")
    assert public_res.status_code == 200
    assert any(j["id"] == j_id for j in public_res.json()["items"])

    # Admin deactivates (DELETE) the article
    del_res = client.delete(f"/api/v1/admin/journals/{j_id}", headers=headers)
    assert del_res.status_code == 204

    # Public GET by ID now returns 404
    after_get = client.get(f"/api/v1/journals/{j_id}")
    assert after_get.status_code == 404

    # Public browse no longer lists it
    after_browse = client.get("/api/v1/journals?search=Boswellia")
    assert not any(j["id"] == j_id for j in after_browse.json()["items"])


def test_journal_ingestion_runs(client, admin_token, doctor_token):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 1. Start ingestion run (Elsevier without key reports clean provider integration failure)
    req_payload = {
        "source": "elsevier-sciencedirect",
        "query": "Ayurveda randomized controlled trials",
    }
    start_res = client.post(
        "/api/v1/admin/journal-ingestion-runs",
        json=req_payload,
        headers=headers_admin,
    )
    assert start_res.status_code == 202
    run_data = start_res.json()
    run_id = run_data["id"]
    assert run_data["source"] == req_payload["source"]
    assert run_data["status"] == "failed"
    assert "ELSEVIER_API_KEY is not configured" in run_data["error"]

    # 2. List runs
    list_res = client.get("/api/v1/admin/journal-ingestion-runs", headers=headers_admin)
    assert list_res.status_code == 200
    assert any(r["id"] == run_id for r in list_res.json()["items"])

    # 3. Get specific run by ID
    get_res = client.get(f"/api/v1/admin/journal-ingestion-runs/{run_id}", headers=headers_admin)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == run_id

    # 4. RBAC: doctor is rejected from admin ingestion runs -> 403 Forbidden
    headers_doc = {"Authorization": f"Bearer {doctor_token}"}
    forbidden_res = client.get("/api/v1/admin/journal-ingestion-runs", headers=headers_doc)
    assert forbidden_res.status_code == 403
