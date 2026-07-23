"""Integration tests for URL shortener endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestCreateURL:
    async def test_create_url_success(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        response = await client.post("/api/v1/urls/", json=url_payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert "slug" in data
        assert "short_url" in data
        assert data["long_url"] == url_payload["long_url"]
        assert data["title"] == url_payload["title"]
        assert data["is_active"] is True
        assert data["click_count"] == 0

    async def test_create_url_unauthenticated(self, client: AsyncClient, url_payload: dict):
        response = await client.post("/api/v1/urls/", json=url_payload)
        assert response.status_code == 401

    async def test_create_url_with_custom_alias(
        self, client: AsyncClient, auth_headers: dict
    ):
        payload = {
            "long_url": "https://example.com",
            "custom_alias": "my-custom-alias",
        }
        response = await client.post("/api/v1/urls/", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["slug"] == "my-custom-alias"
        assert data["is_custom_alias"] is True

    async def test_create_url_duplicate_alias(
        self, client: AsyncClient, auth_headers: dict
    ):
        payload = {"long_url": "https://example.com", "custom_alias": "duplicate"}
        await client.post("/api/v1/urls/", json=payload, headers=auth_headers)
        response = await client.post("/api/v1/urls/", json=payload, headers=auth_headers)
        # Second request should return existing URL (dedup by hash) not conflict
        # because same user, same URL
        assert response.status_code in (200, 201)

    async def test_create_url_alias_taken_by_other_url(
        self, client: AsyncClient, auth_headers: dict
    ):
        await client.post(
            "/api/v1/urls/",
            json={"long_url": "https://a.com", "custom_alias": "taken"},
            headers=auth_headers,
        )
        response = await client.post(
            "/api/v1/urls/",
            json={"long_url": "https://b.com", "custom_alias": "taken"},
            headers=auth_headers,
        )
        assert response.status_code == 409

    async def test_create_url_invalid_long_url(
        self, client: AsyncClient, auth_headers: dict
    ):
        response = await client.post(
            "/api/v1/urls/",
            json={"long_url": "not-a-url"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_create_url_deduplication(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Same user shortening the same URL should return the same slug."""
        payload = {"long_url": "https://same-url.com/path"}
        r1 = await client.post("/api/v1/urls/", json=payload, headers=auth_headers)
        r2 = await client.post("/api/v1/urls/", json=payload, headers=auth_headers)
        assert r1.status_code == 201
        assert r2.status_code in (200, 201)
        assert r1.json()["slug"] == r2.json()["slug"]

    async def test_create_url_invalid_custom_alias_chars(
        self, client: AsyncClient, auth_headers: dict
    ):
        response = await client.post(
            "/api/v1/urls/",
            json={"long_url": "https://example.com", "custom_alias": "has spaces!"},
            headers=auth_headers,
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestListURLs:
    async def test_list_urls_empty(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/urls/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_urls_with_data(
        self, client: AsyncClient, auth_headers: dict
    ):
        for i in range(3):
            await client.post(
                "/api/v1/urls/",
                json={"long_url": f"https://example.com/{i}"},
                headers=auth_headers,
            )
        response = await client.get("/api/v1/urls/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["items"]) == 3

    async def test_list_urls_pagination(
        self, client: AsyncClient, auth_headers: dict
    ):
        for i in range(5):
            await client.post(
                "/api/v1/urls/",
                json={"long_url": f"https://example.com/page/{i}"},
                headers=auth_headers,
            )
        response = await client.get(
            "/api/v1/urls/", params={"page": 1, "size": 2}, headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["pages"] == 3


@pytest.mark.asyncio
class TestGetURL:
    async def test_get_url_success(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        create_resp = await client.post(
            "/api/v1/urls/", json=url_payload, headers=auth_headers
        )
        slug = create_resp.json()["slug"]
        response = await client.get(f"/api/v1/urls/{slug}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["slug"] == slug

    async def test_get_url_not_found(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/urls/doesnotexist", headers=auth_headers)
        assert response.status_code == 404


@pytest.mark.asyncio
class TestUpdateURL:
    async def test_update_url_title(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        create_resp = await client.post(
            "/api/v1/urls/", json=url_payload, headers=auth_headers
        )
        slug = create_resp.json()["slug"]

        response = await client.patch(
            f"/api/v1/urls/{slug}",
            json={"title": "Updated Title"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    async def test_update_url_deactivate(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        create_resp = await client.post(
            "/api/v1/urls/", json=url_payload, headers=auth_headers
        )
        slug = create_resp.json()["slug"]

        response = await client.patch(
            f"/api/v1/urls/{slug}",
            json={"is_active": False},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False


@pytest.mark.asyncio
class TestDeleteURL:
    async def test_delete_url_success(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        create_resp = await client.post(
            "/api/v1/urls/", json=url_payload, headers=auth_headers
        )
        slug = create_resp.json()["slug"]

        response = await client.delete(f"/api/v1/urls/{slug}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["success"] is True

    async def test_delete_url_not_found(self, client: AsyncClient, auth_headers: dict):
        response = await client.delete("/api/v1/urls/notfound", headers=auth_headers)
        assert response.status_code == 404


@pytest.mark.asyncio
class TestRedirect:
    async def test_redirect_success(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        create_resp = await client.post(
            "/api/v1/urls/", json=url_payload, headers=auth_headers
        )
        slug = create_resp.json()["slug"]

        # Don't follow redirects — check the 302 response directly
        response = await client.get(f"/{slug}", follow_redirects=False)
        assert response.status_code == 302
        assert url_payload["long_url"] in response.headers["location"]

    async def test_redirect_not_found(self, client: AsyncClient):
        response = await client.get("/nonexistentslug99", follow_redirects=False)
        assert response.status_code == 404
