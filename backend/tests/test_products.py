import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config import settings
from app.auth import create_access_token, hash_password
from databases.session import Base, get_db
from databases.schema.models import User, Manufacturer, Product, AuditHistory

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
def manufacturer_user(db_session):
    user = User(
        email="mfg1@pharma.com",
        hashed_password=hash_password("MfgPassword1!"),
        role="manufacturer",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    mfg = Manufacturer(
        user_id=user.id,
        company_name="PureHerbals Ltd",
        contact_name="Aarav Patel",
        contact_email="mfg1@pharma.com",
        verification_status="approved",
    )
    db_session.add(mfg)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(mfg)
    return user, mfg


@pytest.fixture
def other_manufacturer_user(db_session):
    user = User(
        email="mfg2@pharma.com",
        hashed_password=hash_password("MfgPassword2!"),
        role="manufacturer",
        status="active",
    )
    db_session.add(user)
    db_session.flush()

    mfg = Manufacturer(
        user_id=user.id,
        company_name="Apex Ayurvedics",
        contact_name="Meera Joshi",
        contact_email="mfg2@pharma.com",
        verification_status="approved",
    )
    db_session.add(mfg)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(mfg)
    return user, mfg


@pytest.fixture
def admin_token():
    return create_access_token(user_id="admin-101", role="admin")


@pytest.fixture
def mfg_token(manufacturer_user):
    user, _ = manufacturer_user
    return create_access_token(user_id=user.id, role="manufacturer")


@pytest.fixture
def other_mfg_token(other_manufacturer_user):
    user, _ = other_manufacturer_user
    return create_access_token(user_id=user.id, role="manufacturer")


def test_submit_product(client, mfg_token):
    headers = {"Authorization": f"Bearer {mfg_token}"}
    payload = {
        "name": "Ashwagandha Gold Extract",
        "description": "High potency standardized 5% withanolides organic root extract.",
        "category": "Herbal Supplements",
        "price": 29.99,
        "currency": "USD",
    }
    response = client.post("/api/v1/manufacturers/me/products", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["approval_status"] == "pending"
    assert data["is_active"] is True


def test_submit_duplicate_product_name_rejected(client, mfg_token):
    headers = {"Authorization": f"Bearer {mfg_token}"}
    payload = {
        "name": "Triphala Churna Premium",
        "description": "Traditional Ayurvedic digestive formulation.",
        "category": "Digestive Health",
        "price": 14.50,
        "currency": "USD",
    }
    res1 = client.post("/api/v1/manufacturers/me/products", json=payload, headers=headers)
    assert res1.status_code == 201

    # Second submission with same name by same manufacturer -> 409
    res2 = client.post("/api/v1/manufacturers/me/products", json=payload, headers=headers)
    assert res2.status_code == 409
    assert "already have a product registered with this name" in res2.json()["detail"]


def test_list_and_update_own_product(client, mfg_token):
    headers = {"Authorization": f"Bearer {mfg_token}"}
    # Submit product
    payload = {
        "name": "Brahmi Memory Booster",
        "description": "Bacopa monnieri cognitive wellness capsules.",
        "category": "Cognitive Health",
        "price": 24.00,
        "currency": "USD",
    }
    create_res = client.post("/api/v1/manufacturers/me/products", json=payload, headers=headers)
    product_id = create_res.json()["id"]

    # List own products
    list_res = client.get("/api/v1/manufacturers/me/products", headers=headers)
    assert list_res.status_code == 200
    assert any(p["id"] == product_id for p in list_res.json()["items"])

    # Update own product
    update_payload = {"price": 27.50, "description": "Enhanced 10:1 concentration Bacopa."}
    update_res = client.patch(f"/api/v1/manufacturers/me/products/{product_id}", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["price"] == 27.50
    assert update_res.json()["description"] == update_payload["description"]


def test_manufacturer_ownership_enforcement(client, mfg_token, other_mfg_token):
    # Manufacturer 1 creates a product
    headers1 = {"Authorization": f"Bearer {mfg_token}"}
    payload = {
        "name": "Neem Purifying Oil",
        "description": "Cold-pressed pure Azadirachta indica oil.",
        "category": "Skincare",
        "price": 18.00,
        "currency": "USD",
    }
    product_id = client.post("/api/v1/manufacturers/me/products", json=payload, headers=headers1).json()["id"]

    # Manufacturer 2 tries to update Manufacturer 1's product -> 403 Forbidden
    headers2 = {"Authorization": f"Bearer {other_mfg_token}"}
    update_res = client.patch(f"/api/v1/manufacturers/me/products/{product_id}", json={"price": 99.00}, headers=headers2)
    assert update_res.status_code == 403
    assert "permission to modify this product" in update_res.json()["detail"]


def test_public_catalog_visibility_rule(client, mfg_token, admin_token):
    # 1. Create a product (status: pending)
    headers_mfg = {"Authorization": f"Bearer {mfg_token}"}
    payload = {
        "name": "Tulsi Holy Basil Drops",
        "description": "Adaptogenic herbal liquid extract.",
        "category": "Immunity",
        "price": 19.99,
        "currency": "USD",
    }
    prod = client.post("/api/v1/manufacturers/me/products", json=payload, headers=headers_mfg).json()
    product_id = prod["id"]

    # 2. Public cannot see pending product
    public_get = client.get(f"/api/v1/products/{product_id}")
    assert public_get.status_code == 404

    # 3. Public catalog list does not include pending product
    public_list = client.get("/api/v1/products?search=Tulsi")
    assert not any(p["id"] == product_id for p in public_list.json()["items"])

    # 4. Admin approves product
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    decision_payload = {"decision": "approved", "notes": "Formulation and labeling verified."}
    approval_res = client.patch(
        f"/api/v1/admin/products/{product_id}/approval",
        json=decision_payload,
        headers=headers_admin,
    )
    assert approval_res.status_code == 200
    assert approval_res.json()["approval_status"] == "approved"

    # 5. Public can now view the approved product
    public_after = client.get(f"/api/v1/products/{product_id}")
    assert public_after.status_code == 200
    assert public_after.json()["id"] == product_id


def test_admin_list_and_update_products(client, admin_token, mfg_token, db_session):
    headers_mfg = {"Authorization": f"Bearer {mfg_token}"}
    payload = {
        "name": "Guduchi Vitality Tonic",
        "description": "Tinospora cordifolia immune support elixir.",
        "category": "Immunity",
        "price": 22.00,
        "currency": "USD",
    }
    product_id = client.post("/api/v1/manufacturers/me/products", json=payload, headers=headers_mfg).json()["id"]

    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # Admin list with filter
    admin_list = client.get("/api/v1/admin/products?approval_status=pending", headers=headers_admin)
    assert admin_list.status_code == 200
    assert any(p["id"] == product_id for p in admin_list.json()["items"])

    # Admin update product and notes
    admin_update = client.patch(
        f"/api/v1/admin/products/{product_id}",
        json={"admin_notes": "Needs updated batch certificate", "is_active": False},
        headers=headers_admin,
    )
    assert admin_update.status_code == 200
    assert admin_update.json()["is_active"] is False

    # Check audit log
    audit = db_session.query(AuditHistory).filter(
        AuditHistory.target_id == product_id,
        AuditHistory.action == "PRODUCT_ADMIN_UPDATE",
    ).first()
    assert audit is not None


def test_nonexistent_product_returns_404(client, mfg_token, admin_token):
    headers_mfg = {"Authorization": f"Bearer {mfg_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # Manufacturer update nonexistent
    res1 = client.patch("/api/v1/manufacturers/me/products/non-existent-id", json={"price": 10.0}, headers=headers_mfg)
    assert res1.status_code == 404

    # Admin approval nonexistent
    res2 = client.patch("/api/v1/admin/products/non-existent-id/approval", json={"decision": "rejected"}, headers=headers_admin)
    assert res2.status_code == 404
