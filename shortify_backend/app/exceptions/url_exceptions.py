"""Domain-specific exceptions for URL operations."""


class URLException(Exception):
    def __init__(self, message: str = "URL error") -> None:
        self.message = message
        super().__init__(message)


class URLNotFoundException(URLException):
    pass


class URLExpiredException(URLException):
    pass


class AliasAlreadyExistsException(URLException):
    pass


class RateLimitExceededException(Exception):
    def __init__(self, message: str = "Rate limit exceeded") -> None:
        self.message = message
        super().__init__(message)
