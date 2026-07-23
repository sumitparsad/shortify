"""Pydantic v2 schemas for URL shortener endpoints."""

import uuid
from datetime import datetime

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, field_validator


class URLCreate(BaseModel):
    long_url: AnyHttpUrl
    custom_alias: str | None = Field(
        None,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Optional custom alias. If not provided, a NanoID is generated.",
    )
    title: str | None = Field(None, max_length=255)
    expires_at: datetime | None = Field(
        None,
        description="ISO 8601 expiration datetime. Null means never expire.",
    )

    @field_validator("long_url", mode="before")
    @classmethod
    def ensure_str(cls, v: object) -> str:
        return str(v)


class URLUpdate(BaseModel):
    long_url: AnyHttpUrl | None = None
    title: str | None = Field(None, max_length=255)
    expires_at: datetime | None = None
    is_active: bool | None = None

    @field_validator("long_url", mode="before")
    @classmethod
    def ensure_str(cls, v: object) -> str | None:
        return str(v) if v is not None else None


class URLResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    long_url: str
    title: str | None
    short_url: str = ""  # Populated by service layer
    is_active: bool
    is_custom_alias: bool
    click_count: int
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
    owner_id: uuid.UUID


class URLListResponse(BaseModel):
    """Paginated URL list."""
    items: list[URLResponse]
    total: int
    page: int
    size: int
    pages: int
