"""Common response schemas used across the API."""

from typing import Any

from pydantic import BaseModel


class APIResponse(BaseModel):
    """Standard API envelope for non-data responses."""
    success: bool
    message: str
    data: Any | None = None


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    """Standard error response shape for all 4xx/5xx responses."""
    success: bool = False
    error: str
    details: list[ErrorDetail] | None = None
    request_id: str | None = None


class PaginationParams(BaseModel):
    """Common pagination parameters."""
    page: int = 1
    size: int = 20

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size
