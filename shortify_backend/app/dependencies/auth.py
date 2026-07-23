"""
FastAPI dependency factories for authentication and authorization.

DEPENDENCY INJECTION PATTERN:
─────────────────────────────
FastAPI resolves dependencies in a tree. Each route declares what it needs,
and FastAPI figures out the instantiation order:

  get_db() → AsyncSession
  get_redis() → Redis
  get_current_user(db, redis, token) → User

This means:
1. DB session is always closed (generator dependency with finally block)
2. Services are created fresh per request (stateless)
3. Tests can override any dependency with fake implementations

ROLE-BASED ACCESS CONTROL:
require_role("admin") returns a dependency that checks user.role.
This pattern (dependency returning a dependency) is called a "dependency factory"
and is the idiomatic FastAPI way to parameterize dependencies.
"""

from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import RedisCache, get_redis
from app.exceptions.auth_exceptions import (
    AuthException,
    PermissionDeniedException,
)
from app.models.user import User
from app.services.auth_service import AuthService

# OAuth2 bearer token extractor
bearer_scheme = HTTPBearer(auto_error=False)


async def get_auth_service(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> AuthService:
    return AuthService(db=db, cache=RedisCache(redis))


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """
    Dependency: extracts and validates JWT, returns authenticated User.
    Raises 401 if token is missing, invalid, or revoked.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user = await auth_service.get_current_user(credentials.credentials)
        return user
    except AuthException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(*roles: str):
    """
    Dependency factory for role-based access control.

    Usage:
        @router.delete("/admin/user/{id}")
        async def admin_delete(user: User = Depends(require_role("admin"))):
            ...
    """
    async def _check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(roles)}",
            )
        return current_user
    return _check_role


# Convenience type aliases for cleaner route signatures
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_role("admin"))]
DBSession = Annotated[AsyncSession, Depends(get_db)]
RedisClient = Annotated[aioredis.Redis, Depends(get_redis)]
