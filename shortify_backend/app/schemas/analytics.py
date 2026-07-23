"""Pydantic schemas for analytics responses."""

from pydantic import BaseModel


class ClicksByDate(BaseModel):
    date: str
    clicks: int


class ClicksByCountry(BaseModel):
    country_code: str | None
    clicks: int


class ClicksByBrowser(BaseModel):
    browser: str | None
    clicks: int


class ClicksByOS(BaseModel):
    os: str | None
    clicks: int


class ClicksByDevice(BaseModel):
    device_type: str | None
    clicks: int


class URLAnalyticsResponse(BaseModel):
    slug: str
    total_clicks: int
    unique_visitors: int
    clicks_by_date: list[ClicksByDate]
    clicks_by_country: list[ClicksByCountry]
    clicks_by_browser: list[ClicksByBrowser]
    clicks_by_os: list[ClicksByOS]
    clicks_by_device: list[ClicksByDevice]


class TopURLResponse(BaseModel):
    slug: str
    long_url: str
    title: str | None
    click_count: int
    short_url: str
