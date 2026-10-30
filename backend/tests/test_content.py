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
from databases.schema.models import User, PublicRelation, BlogPost

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


@pytest.fixture(scope="function")
def content_manager_user(db_session):
    user = User(
        email="content@meyveda.com",
        hashed_password=hash_password("mey@123"),
        role="content_manager",
        status="active",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def content_manager_token(content_manager_user):
    return create_access_token(user_id=content_manager_user.id, role="content_manager")


def test_public_relations_crud_and_public_access(client, content_manager_token):
    headers = {"Authorization": f"Bearer {content_manager_token}"}

    # 1. Initially empty
    res = client.get("/api/v1/content/pr")
    assert res.status_code == 200
    assert res.json() == []

    # 2. Unauthenticated create rejected
    res = client.post("/api/v1/content/pr", json={"title": "Test PR", "summary": "Short summary", "content": "Full body text"})
    assert res.status_code == 401

    # 3. Create PR as Content Manager
    create_payload = {
        "title": "Meyveda Expands AYUSH Operations Across Districts",
        "summary": "Official rollout of practitioner desk across tier-2 cities.",
        "content": "Detailed release information regarding clinical onboarding and medicine supply logistics.",
        "media_source": "Meyveda Media Desk",
        "category": "Press Release",
        "is_featured": True,
        "status": "published",
    }
    res = client.post("/api/v1/content/pr", json=create_payload, headers=headers)
    assert res.status_code == 201
    pr_data = res.json()
    assert pr_data["title"] == create_payload["title"]
    assert pr_data["slug"] == "meyveda-expands-ayush-operations-across-districts"
    pr_id = pr_data["id"]

    # 4. Public list shows published PR
    res = client.get("/api/v1/content/pr")
    assert res.status_code == 200
    assert len(res.json()) == 1

    # 5. Public slug lookup
    res = client.get(f"/api/v1/content/pr/{pr_data['slug']}")
    assert res.status_code == 200
    assert res.json()["id"] == pr_id

    # 6. Update PR
    res = client.put(f"/api/v1/content/pr/{pr_id}", json={"title": "Updated Press Release Title"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Updated Press Release Title"

    # 7. Delete PR
    res = client.delete(f"/api/v1/content/pr/{pr_id}", headers=headers)
    assert res.status_code == 200

    # 8. Verified deleted
    res = client.get("/api/v1/content/pr")
    assert len(res.json()) == 0


def test_blogs_crud_and_public_access(client, content_manager_token):
    headers = {"Authorization": f"Bearer {content_manager_token}"}

    # 1. Create Blog Post as Content Manager
    create_payload = {
        "title": "Classical Pulse Diagnosis & Modern Evidence",
        "summary": "Standardizing Nadi Pariksha documentation in clinical workflows.",
        "content": "Pulse examination provides instant constitutional insights. We detail the standardized protocol.",
        "author_name": "Dr. Ramesh Vaidya",
        "author_role": "Chief Ayurvedic Physician",
        "category": "Clinical Practice",
        "reading_time": "5 min read",
        "tags": ["Nadi", "Diagnostics"],
        "is_featured": True,
        "status": "published",
    }
    res = client.post("/api/v1/content/blogs", json=create_payload, headers=headers)
    assert res.status_code == 201
    blog_data = res.json()
    assert blog_data["slug"] == "classical-pulse-diagnosis-modern-evidence"
    blog_id = blog_data["id"]

    # 2. Public blog list shows post
    res = client.get("/api/v1/content/blogs")
    assert res.status_code == 200
    assert len(res.json()) == 1

    # 3. Public slug lookup
    res = client.get(f"/api/v1/content/blogs/{blog_data['slug']}")
    assert res.status_code == 200
    assert res.json()["id"] == blog_id

    # 4. Content manager manage overview
    res = client.get("/api/v1/content/manage/all", headers=headers)
    assert res.status_code == 200
    overview = res.json()
    assert overview["metrics"]["total_blogs"] == 1

    # 5. Delete Blog
    res = client.delete(f"/api/v1/content/blogs/{blog_id}", headers=headers)
    assert res.status_code == 200

    # 6. Verified deleted
    res = client.get("/api/v1/content/blogs")
    assert len(res.json()) == 0


def test_content_manager_restricted_from_admin_endpoints(client, content_manager_token):
    headers = {"Authorization": f"Bearer {content_manager_token}"}

    # Content Manager attempting to access admin-only endpoints must receive 403 Forbidden
    res = client.get("/api/v1/admin/doctors", headers=headers)
    assert res.status_code == 403
    assert res.json()["detail"] == "Insufficient permissions"
