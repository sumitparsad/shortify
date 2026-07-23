"""Domain-specific exceptions for authentication."""


class AuthException(Exception):
    """Base auth exception."""
    def __init__(self, message: str = "Authentication error") -> None:
        self.message = message
        super().__init__(message)


class CredentialsException(AuthException):
    """Invalid email/password."""
    pass


class InvalidTokenException(AuthException):
    """Malformed or expired token."""
    pass


class TokenRevokedException(AuthException):
    """Token was explicitly revoked (logout)."""
    pass


class InactiveUserException(AuthException):
    """User account is disabled."""
    pass


class UserAlreadyExistsException(AuthException):
    """Email or username is taken."""
    pass


class PermissionDeniedException(AuthException):
    """Insufficient role/permissions."""
    pass
