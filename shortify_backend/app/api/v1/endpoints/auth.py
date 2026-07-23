"""
Authentication endpoints.

Routes:
  POST /api/v1/auth/register   → Create new user account
  POST /api/v1/auth/login      → Issue access + refresh tokens
  POST /api/v1/auth/refresh    → Rotate tokens using refresh token
  POST /api/v1/auth/logout     → Revoke tokens (blocklist in Redis)
  GET  /api/v1/auth/me         → Return current user profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import RedisCache, get_redis
from app.dependencies.auth import CurrentUser, get_auth_service
from app.exceptions.auth_exceptions import AuthException
from app.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, TokenResponse
from app.schemas.common import APIResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])
bearer_scheme = HTTPBearer()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email, username, and password.",
)
async def register(
    data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    user = await auth_service.register(data)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive JWT tokens",
    description=(
        "Authenticate with email and password. "
        "Returns short-lived access token and long-lived refresh token."
    ),
)
async def login(
    data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.login(data.email, data.password)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Use a valid refresh token to obtain a new access + refresh token pair.",
)
async def refresh(
    data: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.refresh(data.refresh_token)


@router.post(
    "/logout",
    response_model=APIResponse,
    summary="Logout (revoke tokens)",
    description="Revokes both access and refresh tokens. They are blocklisted in Redis until expiry.",
)
async def logout(
    data: LogoutRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
):
    await auth_service.logout(credentials.credentials, data.refresh_token)
    return APIResponse(success=True, message="Logged out successfully")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Returns the authenticated user's profile.",
)
async def get_me(current_user: CurrentUser):
    return current_user
