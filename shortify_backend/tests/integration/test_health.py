"""Integration tests for health check endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestHealthCheck:
    async def test_health_returns_200(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "environment" in data

    async def test_readiness_check(self, client: AsyncClient):
        response = await client.get("/health/ready")
        # May be 200 (redis mock pings ok) or 503 depending on mock
        assert response.status_code in (200, 503)
        data = response.json()
        assert "redis" in data
