"""
Security utilities: JWT creation/validation and bcrypt password hashing.

WHY BCRYPT?
- bcrypt has an intentional work factor (cost) — slows brute force attacks
- Automatic salt generation per hash
- Even if the DB leaks, rainbow tables cannot crack bcrypt hashes cost-effectively
- We use bcrypt directly (not passlib) for compatibility with bcrypt 4.x/5.x

WHY JWT?
- Stateless auth — any API server can validate a token without hitting the DB
  (critical for horizontal scaling; no shared session store needed)
- Access token (short TTL) + Refresh token (long TTL) is the standard OAuth2 pattern:
  - Short access token TTL limits exposure if a token is stolen
  - Refresh token lets users stay logged in without re-authenticating

INTERVIEW QUESTION: "How would you invalidate a JWT before it expires?"
Answer:
  Option A: Maintain a Redis blocklist of revoked JTI (JWT ID) values.
            On every request, check blocklist — O(1) lookup.
  Option B: Use opaque tokens + token introspection endpoint.
            Adds latency (DB hit) but simpler revocation.
  We implement Option A (JTI blocklist in Redis).
"""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# ── Password Hashing ──────────────────────────────────────────────────────────
# WHY bcrypt DIRECTLY instead of passlib?
# passlib is a compatibility shim; bcrypt 4.x+ changed its internal API,
# causing passlib 1.7.x to raise ValueError. Using bcrypt directly is cleaner.
_BCRYPT_ROUNDS = 12  # Work factor: 2^12 iterations (~250ms on modern hardware)


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt with automatic salting."""
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


# Compared against when the account doesn't exist, so a failed login costs the same
# bcrypt time either way and response timing doesn't reveal which emails are registered.
DUMMY_PASSWORD_HASH = bcrypt.hashpw(b"dummy-password", bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Constant-time bcrypt comparison — prevents timing attacks.
    bcrypt.checkpw() always runs the full hash computation.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


# ── JWT Helpers ───────────────────────────────────────────────────────────────
def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """
    Create a short-lived JWT access token.

    The 'jti' (JWT ID) claim is a unique identifier for this specific token.
    It lets us blocklist individual tokens in Redis without invalidating all tokens
    for a user (which would log out all their devices).
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(UTC),
        "jti": str(uuid4()),  # Unique token ID for revocation
        "type": "access",
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict[str, Any]) -> str:
    """Create a long-lived refresh token."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(UTC),
        "jti": str(uuid4()),
        "type": "refresh",
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT.
    Raises JWTError on invalid signature, expiry, or malformed token.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def get_revocation_claims(token: str) -> tuple[str, int] | None:
    """
    Return (jti, seconds until expiry) for a correctly signed token, ignoring expiry.
    Used for revocation: the blocklist entry only needs to live as long as the token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": False},
        )
    except JWTError:
        return None
    jti, exp = payload.get("jti"), payload.get("exp")
    if not jti or not exp:
        return None
    return jti, int(exp - datetime.now(UTC).timestamp())
