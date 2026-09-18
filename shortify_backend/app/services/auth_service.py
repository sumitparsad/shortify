"""
Authentication Service — orchestrates auth logic across repositories + Redis.

SERVICE RESPONSIBILITY:
- Validate credentials
- Generate and return tokens
- Manage token revocation via Redis blocklist
- Coordinate between UserRepository and Redis

This layer is intentionally free of HTTP concerns (no Request/Response objects).
That makes it testable in isolation and reusable (e.g., in a CLI or background job).
"""

import uuid

from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.redis import RedisCache, token_blocklist_key
from app.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_revocation_claims,
    hash_password,
    verify_password,
)
from app.exceptions.auth_exceptions import (
    CredentialsException,
    InactiveUserException,
    InvalidTokenException,
    TokenRevokedException,
    UserAlreadyExistsException,
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, db: AsyncSession, cache: RedisCache) -> None:
        self._user_repo = UserRepository(db)
        self._cache = cache

    async def register(self, data: UserCreate) -> dict:
        """Register a new user. Returns user record."""
        if await self._user_repo.email_exists(data.email):
            raise UserAlreadyExistsException("Email already registered")
        if await self._user_repo.username_exists(data.username):
            raise UserAlreadyExistsException("Username already taken")

        user = await self._user_repo.create(
            email=data.email,
            username=data.username,
            hashed_password=hash_password(data.password),
        )
        return user

    async def login(self, email: str, password: str) -> TokenResponse:
        """Authenticate user and issue access + refresh tokens."""
        user = await self._user_repo.get_by_email(email)

        # Always run bcrypt (against a dummy hash for unknown emails) so response
        # timing doesn't reveal whether an account exists.
        password_ok = verify_password(password, user.hashed_password if user else DUMMY_PASSWORD_HASH)
        if not user or not password_ok:
            raise CredentialsException("Invalid email or password")

        if not user.is_active:
            raise InactiveUserException("Account is disabled")

        token_data = {"sub": str(user.id), "role": user.role}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Issue a new access token using a valid refresh token."""
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise InvalidTokenException("Invalid refresh token")

        if payload.get("type") != "refresh":
            raise InvalidTokenException("Not a refresh token")

        jti = payload.get("jti")
        if jti and await self._is_token_revoked(jti):
            raise TokenRevokedException("Token has been revoked")

        user_id = payload.get("sub")
        user = await self._user_repo.get_by_id(uuid.UUID(user_id))
        if not user or not user.is_active:
            raise InvalidTokenException("User not found or inactive")

        # Rotation: each refresh token is single-use, so a leaked one stops working
        # as soon as the legitimate client refreshes.
        await self._revoke(refresh_token)

        token_data = {"sub": str(user.id), "role": user.role}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def logout(self, access_token: str | None, refresh_token: str) -> None:
        """
        Revoke both tokens by adding their JTIs to the Redis blocklist.

        WHY REDIS BLOCKLIST?
        JWTs are self-contained — the server can't "un-issue" them.
        By storing the JTI in Redis with TTL = token expiry, we effectively
        invalidate the token. The overhead is one Redis GET per authenticated request.
        """
        for token in (access_token, refresh_token):
            if token:
                await self._revoke(token)

    async def _revoke(self, token: str) -> None:
        """Blocklist a token's JTI until the token would have expired anyway."""
        claims = get_revocation_claims(token)
        if not claims:
            return
        jti, seconds_left = claims
        if seconds_left > 0:
            await self._cache.set(token_blocklist_key(jti), "revoked", ttl=seconds_left)

    async def _is_token_revoked(self, jti: str) -> bool:
        return await self._cache.exists(token_blocklist_key(jti))

    async def get_current_user(self, token: str):
        """Validate an access token and return the User object."""
        try:
            payload = decode_token(token)
        except JWTError:
            raise InvalidTokenException("Could not validate credentials")

        if payload.get("type") != "access":
            raise InvalidTokenException("Not an access token")

        jti = payload.get("jti")
        if jti and await self._is_token_revoked(jti):
            raise TokenRevokedException("Token has been revoked")

        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenException("Token missing subject")

        user = await self._user_repo.get_by_id(uuid.UUID(user_id))
        if not user:
            raise InvalidTokenException("User not found")
        if not user.is_active:
            raise InactiveUserException("Account is disabled")

        return user
