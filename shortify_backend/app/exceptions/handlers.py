"""
Global exception handlers registered on the FastAPI app.

WHY GLOBAL HANDLERS?
- Every route would need try/except boilerplate without them
- Consistent error shape across the entire API
- Centralized error logging with request context

CONSISTENT ERROR SHAPE:
{
  "success": false,
  "error": "Human-readable message",
  "details": [...],   # Optional field-level errors
  "request_id": "..."
}
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.exceptions.auth_exceptions import (
    AuthException,
    CredentialsException,
    InactiveUserException,
    InvalidTokenException,
    PermissionDeniedException,
    TokenRevokedException,
    UserAlreadyExistsException,
)
from app.exceptions.url_exceptions import (
    AliasAlreadyExistsException,
    RateLimitExceededException,
    URLExpiredException,
    URLNotFoundException,
    URLOwnershipException,
)


def _error_response(error: str, status_code: int, details=None, request_id: str | None = None):
    content = {"success": False, "error": error}
    if details:
        content["details"] = details
    if request_id:
        content["request_id"] = request_id
    return JSONResponse(status_code=status_code, content=content)


def register_exception_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the app instance."""

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        details = [
            {"field": ".".join(str(loc) for loc in e["loc"]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return _error_response(
            "Validation error",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
            request_id=request.state.request_id if hasattr(request.state, "request_id") else None,
        )

    @app.exception_handler(URLNotFoundException)
    async def url_not_found_handler(request: Request, exc: URLNotFoundException):
        return _error_response(exc.message, status.HTTP_404_NOT_FOUND)

    @app.exception_handler(URLExpiredException)
    async def url_expired_handler(request: Request, exc: URLExpiredException):
        return _error_response(exc.message, status.HTTP_410_GONE)

    @app.exception_handler(URLOwnershipException)
    async def url_ownership_handler(request: Request, exc: URLOwnershipException):
        return _error_response(exc.message, status.HTTP_403_FORBIDDEN)

    @app.exception_handler(AliasAlreadyExistsException)
    async def alias_exists_handler(request: Request, exc: AliasAlreadyExistsException):
        return _error_response(exc.message, status.HTTP_409_CONFLICT)

    @app.exception_handler(UserAlreadyExistsException)
    async def user_exists_handler(request: Request, exc: UserAlreadyExistsException):
        return _error_response(exc.message, status.HTTP_409_CONFLICT)

    @app.exception_handler(CredentialsException)
    async def credentials_handler(request: Request, exc: CredentialsException):
        return _error_response(exc.message, status.HTTP_401_UNAUTHORIZED)

    @app.exception_handler(InvalidTokenException)
    async def invalid_token_handler(request: Request, exc: InvalidTokenException):
        return _error_response(exc.message, status.HTTP_401_UNAUTHORIZED)

    @app.exception_handler(TokenRevokedException)
    async def token_revoked_handler(request: Request, exc: TokenRevokedException):
        return _error_response(exc.message, status.HTTP_401_UNAUTHORIZED)

    @app.exception_handler(InactiveUserException)
    async def inactive_user_handler(request: Request, exc: InactiveUserException):
        return _error_response(exc.message, status.HTTP_403_FORBIDDEN)

    @app.exception_handler(PermissionDeniedException)
    async def permission_denied_handler(request: Request, exc: PermissionDeniedException):
        return _error_response(exc.message, status.HTTP_403_FORBIDDEN)

    @app.exception_handler(RateLimitExceededException)
    async def rate_limit_handler(request: Request, exc: RateLimitExceededException):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"success": False, "error": exc.message},
            headers={"Retry-After": "60"},
        )

    @app.exception_handler(IntegrityError)
    async def db_integrity_handler(request: Request, exc: IntegrityError):
        return _error_response(
            "Database integrity error — possible duplicate entry",
            status.HTTP_409_CONFLICT,
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        # Log the unexpected error but don't expose internals to the client
        import structlog
        logger = structlog.get_logger(__name__)
        logger.exception("Unexpected error", exc_info=exc)
        return _error_response(
            "An unexpected error occurred",
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            request_id=getattr(request.state, "request_id", None),
        )
