from datetime import datetime, timedelta, timezone
from typing import Literal, Callable, TypedDict
import threading
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from databases.session import get_db
from databases.schema.models import User

bearer_scheme = HTTPBearer(auto_error=False)

Role = Literal["manufacturer", "doctor", "admin"]


class UserClaims(TypedDict):
    sub: str
    role: Role


def hash_password(password: str) -> str:
    """Hash a plaintext password securely with bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, role: str, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token."""
    secret = settings.JWT_SECRET_KEY
    if not secret or len(secret.encode("utf-8")) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="JWT authentication is not configured",
        )

    now = datetime.now(timezone.utc)
    if expires_delta is not None:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(to_encode, secret, algorithm=settings.JWT_ALGORITHM)


_revoked_tokens: set[str] = set()
_revocation_lock = threading.Lock()


def revoke_token(token: str) -> None:
    """Add a JWT token to the revocation blacklist upon logout."""
    with _revocation_lock:
        _revoked_tokens.add(token)


def is_token_revoked(token: str) -> bool:
    """Check if a token has been revoked."""
    with _revocation_lock:
        return token in _revoked_tokens


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    if is_token_revoked(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    secret = settings.JWT_SECRET_KEY
    if not secret or len(secret.encode("utf-8")) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="JWT authentication is not configured",
        )

    try:
        payload = jwt.decode(token, secret, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user_claims(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UserClaims:
    """
    Extracts and validates user claims from the Bearer token without querying the DB.
    Preserves fast claim authentication.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = decode_access_token(credentials.credentials)
    subject = claims.get("sub")
    role = claims.get("role")

    if not isinstance(subject, str) or role not in ("manufacturer", "doctor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token claims",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {"sub": subject, "role": role}


def get_current_active_user(
    claims: UserClaims = Depends(get_current_user_claims),
    db: Session = Depends(get_db),
) -> User:
    """
    Fetches the authenticated user from the database and checks that their status is active.
    Prevents trusting client claims if the user was deleted or disabled.
    """
    user = db.query(User).filter(User.id == claims["sub"]).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )
    return user


def require_roles(*required_roles: Role) -> Callable[..., UserClaims]:
    """Preserves existing role-based access checking using UserClaims."""
    if not required_roles:
        raise ValueError("At least one role must be provided")

    def authenticate(
        claims: UserClaims = Depends(get_current_user_claims),
    ) -> UserClaims:
        if claims["role"] not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return claims

    return authenticate


def require_role(required_role: Role) -> Callable[..., UserClaims]:
    """Helper for single-role authorization requirement."""
    return require_roles(required_role)
