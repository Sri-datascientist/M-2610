from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth import UserClaims, require_role
from databases.session import get_db
from databases.schema.models import Manufacturer, Product, AuditHistory

router = APIRouter(tags=["products"])


# --- Schemas ---

class ProductSubmission(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    category: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    price: float | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")


class ProductAdminUpdate(ProductUpdate):
    is_active: bool | None = None
    admin_notes: str | None = Field(default=None, max_length=2000)


class ProductRecord(ProductSubmission):
    id: str
    manufacturer_id: str
    approval_status: Literal["pending", "approved", "rejected"]
    is_active: bool = True


class ProductList(BaseModel):
    items: list[ProductRecord]
    total: int


class ProductApprovalDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    notes: str | None = Field(default=None, max_length=2000)


def _build_product_record(product: Product) -> ProductRecord:
    return ProductRecord(
        id=product.id,
        manufacturer_id=product.manufacturer_id,
        name=product.name,
        description=product.description,
        category=product.category,
        price=product.price,
        currency=product.currency,
        approval_status=product.approval_status,
        is_active=product.is_active,
    )


# --- Endpoints ---

@router.get(
    "/api/v1/products",
    response_model=ProductList,
    summary="Public: Browse approved and active products",
)
def browse_products(
    search: str | None = Query(default=None, description="Search approved product name or description"),
    category: str | None = Query(default=None, min_length=1, max_length=100),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> ProductList:
    # Public catalog only returns approved and active products
    query = db.query(Product).filter(
        Product.approval_status == "approved",
        Product.is_active.is_(True),
    )

    if category:
        query = query.filter(Product.category.ilike(category))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_filter),
                Product.description.ilike(search_filter),
            )
        )

    total = query.count()
    products = query.offset(offset).limit(limit).all()

    return ProductList(
        items=[_build_product_record(p) for p in products],
        total=total,
    )


@router.get(
    "/api/v1/products/{productId}",
    response_model=ProductRecord,
    summary="Public: Get approved product details by ID",
)
def get_product(
    product_id: str = Path(alias="productId"),
    db: Session = Depends(get_db),
) -> ProductRecord:
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.approval_status == "approved",
        Product.is_active.is_(True),
    ).first()

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or not available.",
        )
    return _build_product_record(product)


@router.post(
    "/api/v1/manufacturers/me/products",
    response_model=ProductRecord,
    status_code=status.HTTP_201_CREATED,
    summary="Manufacturer: Submit a new product for approval",
)
def submit_product(
    payload: ProductSubmission,
    user: UserClaims = Depends(require_role("manufacturer")),
    db: Session = Depends(get_db),
) -> ProductRecord:
    manufacturer = db.query(Manufacturer).filter(Manufacturer.user_id == user["sub"]).first()
    if manufacturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer profile not found.",
        )

    # Check for duplicate product under this manufacturer
    existing = db.query(Product).filter(
        Product.manufacturer_id == manufacturer.id,
        Product.name.ilike(payload.name),
    ).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a product registered with this name.",
        )

    new_product = Product(
        manufacturer_id=manufacturer.id,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        price=payload.price,
        currency=payload.currency.upper(),
        approval_status="pending",  # Newly submitted products always start as pending
        is_active=True,
    )
    db.add(new_product)

    audit = AuditHistory(
        actor_id=user["sub"],
        action="PRODUCT_SUBMITTED",
        target_entity="Product",
        target_id=new_product.id,
        details={"name": new_product.name, "category": new_product.category},
    )
    db.add(audit)

    db.commit()
    db.refresh(new_product)
    return _build_product_record(new_product)


@router.get(
    "/api/v1/manufacturers/me/products",
    response_model=ProductList,
    summary="Manufacturer: List own submitted products",
)
def list_own_products(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("manufacturer")),
    db: Session = Depends(get_db),
) -> ProductList:
    manufacturer = db.query(Manufacturer).filter(Manufacturer.user_id == user["sub"]).first()
    if manufacturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer profile not found.",
        )

    query = db.query(Product).filter(Product.manufacturer_id == manufacturer.id)
    total = query.count()
    products = query.offset(offset).limit(limit).all()

    return ProductList(
        items=[_build_product_record(p) for p in products],
        total=total,
    )


@router.patch(
    "/api/v1/manufacturers/me/products/{productId}",
    response_model=ProductRecord,
    summary="Manufacturer: Update own product details",
)
def update_own_product(
    payload: ProductUpdate,
    product_id: str = Path(alias="productId"),
    user: UserClaims = Depends(require_role("manufacturer")),
    db: Session = Depends(get_db),
) -> ProductRecord:
    manufacturer = db.query(Manufacturer).filter(Manufacturer.user_id == user["sub"]).first()
    if manufacturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer profile not found.",
        )

    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    # Enforce manufacturer ownership
    if product.manufacturer_id != manufacturer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this product.",
        )

    if payload.name is not None:
        # Check duplicate name for same manufacturer
        existing = db.query(Product).filter(
            Product.manufacturer_id == manufacturer.id,
            Product.name.ilike(payload.name),
            Product.id != product.id,
        ).first()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another product with this name already exists.",
            )
        product.name = payload.name

    if payload.description is not None:
        product.description = payload.description
    if payload.category is not None:
        product.category = payload.category
    if payload.price is not None:
        product.price = payload.price
    if payload.currency is not None:
        product.currency = payload.currency.upper()

    # If the product was previously rejected or updated, leave or reset to pending
    # Manufacturers cannot self-approve
    audit = AuditHistory(
        actor_id=user["sub"],
        action="PRODUCT_MANUFACTURER_UPDATE",
        target_entity="Product",
        target_id=product.id,
        details={"updated_fields": list(payload.model_dump(exclude_unset=True).keys())},
    )
    db.add(audit)

    db.commit()
    db.refresh(product)
    return _build_product_record(product)


@router.get(
    "/api/v1/admin/products",
    response_model=ProductList,
    summary="Admin: List all products across manufacturers with filters",
)
def list_products_for_admin(
    search: str | None = Query(default=None, description="Search product name or description"),
    approval_status: Literal["pending", "approved", "rejected"] | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> ProductList:
    query = db.query(Product)

    if approval_status is not None:
        query = query.filter(Product.approval_status == approval_status)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_filter),
                Product.description.ilike(search_filter),
            )
        )

    total = query.count()
    products = query.offset(offset).limit(limit).all()

    return ProductList(
        items=[_build_product_record(p) for p in products],
        total=total,
    )


@router.patch(
    "/api/v1/admin/products/{productId}/approval",
    response_model=ProductRecord,
    summary="Admin: Decide approval for a product",
)
def decide_product_approval(
    payload: ProductApprovalDecision,
    product_id: str = Path(alias="productId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> ProductRecord:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    previous_status = product.approval_status
    product.approval_status = payload.decision
    if payload.notes:
        product.admin_notes = payload.notes

    audit = AuditHistory(
        actor_id=user["sub"],
        action="PRODUCT_APPROVAL_DECISION",
        target_entity="Product",
        target_id=product.id,
        details={
            "previous_status": previous_status,
            "new_status": payload.decision,
            "notes": payload.notes,
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(product)
    return _build_product_record(product)


@router.patch(
    "/api/v1/admin/products/{productId}",
    response_model=ProductRecord,
    summary="Admin: Update product details and admin status",
)
def update_product_as_admin(
    payload: ProductAdminUpdate,
    product_id: str = Path(alias="productId"),
    user: UserClaims = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> ProductRecord:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    if payload.name is not None:
        product.name = payload.name
    if payload.description is not None:
        product.description = payload.description
    if payload.category is not None:
        product.category = payload.category
    if payload.price is not None:
        product.price = payload.price
    if payload.currency is not None:
        product.currency = payload.currency.upper()
    if payload.is_active is not None:
        product.is_active = payload.is_active
    if payload.admin_notes is not None:
        product.admin_notes = payload.admin_notes

    audit = AuditHistory(
        actor_id=user["sub"],
        action="PRODUCT_ADMIN_UPDATE",
        target_entity="Product",
        target_id=product.id,
        details={"updated_fields": list(payload.model_dump(exclude_unset=True).keys())},
    )
    db.add(audit)

    db.commit()
    db.refresh(product)
    return _build_product_record(product)
