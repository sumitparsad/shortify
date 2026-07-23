"""Integration tests for authentication endpoints."""

import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
class TestRegister:
    async def test_register_success(self, client: AsyncClient, user_payload: dict):
        response = await client.post("/api/v1/auth/register", json=user_payload)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_payload["email"]
        assert data["username"] == user_payload["username"]
        assert "hashed_password" not in data
        assert "id" in data
        assert data["role"] == "user"
        assert data["is_active"] is True

    async def test_register_duplicate_email(self, client: AsyncClient, user_payload: dict):
        await client.post("/api/v1/auth/register", json=user_payload)
        response = await client.post("/api/v1/auth/register", json=user_payload)
        assert response.status_code == 409
        assert "already" in response.json()["error"].lower()

    async def test_register_duplicate_username(self, client: AsyncClient, user_payload: dict):
        await client.post("/api/v1/auth/register", json=user_payload)
        payload = {**user_payload, "email": "other@example.com"}
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 409

    async def test_register_weak_password(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": "a@b.com", "username": "user1", "password": "weak"},
        )
        assert response.status_code == 422

    async def test_register_invalid_email(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": "not-an-email", "username": "user1", "password": "TestPass1"},
        )
        assert response.status_code == 422

    async def test_register_short_username(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": "a@b.com", "username": "ab", "password": "TestPass1"},
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestLogin:
    async def test_login_success(self, client: AsyncClient, user_payload: dict, registered_user: dict):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": user_payload["email"], "password": user_payload["password"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0

    async def test_login_wrong_password(self, client: AsyncClient, user_payload: dict, registered_user: dict):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": user_payload["email"], "password": "WrongPass1"},
        )
        assert response.status_code == 401

    async def test_login_nonexistent_email(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@example.com", "password": "TestPass1"},
        )
        assert response.status_code == 401

    async def test_login_missing_fields(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/login", json={"email": "a@b.com"})
        assert response.status_code == 422


@pytest.mark.asyncio
class TestTokenRefresh:
    async def test_refresh_success(self, client: AsyncClient, user_payload: dict, registered_user: dict):
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": user_payload["email"], "password": user_payload["password"]},
        )
        refresh_token = login_resp.json()["refresh_token"]

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_with_access_token_fails(self, client: AsyncClient, auth_headers: dict):
        access_token = auth_headers["Authorization"].split(" ")[1]
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": access_token},
        )
        assert response.status_code == 401

    async def test_refresh_with_invalid_token(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
class TestGetMe:
    async def test_get_me_authenticated(self, client: AsyncClient, auth_headers: dict, user_payload: dict):
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_payload["email"]

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    async def test_get_me_invalid_token(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token"},
        )
        assert response.status_code == 401
