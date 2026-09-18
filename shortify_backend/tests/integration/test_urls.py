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


async def _other_user_headers(client: AsyncClient) -> dict:
    payload = {"email": "other_user@example.com", "username": "other_user", "password": "TestPass1"}
    await client.post("/api/v1/auth/register", json=payload)
    response = await client.post(
        "/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.mark.asyncio
class TestUserIsolation:
    async def test_other_user_cannot_see_or_modify_link(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        slug = (await client.post("/api/v1/urls/", json=url_payload, headers=auth_headers)).json()["slug"]
        other = await _other_user_headers(client)

        assert (await client.get("/api/v1/urls/", headers=other)).json()["total"] == 0
        assert (await client.get(f"/api/v1/urls/{slug}", headers=other)).status_code == 404
        assert (
            await client.patch(f"/api/v1/urls/{slug}", json={"title": "x"}, headers=other)
        ).status_code == 404
        assert (await client.delete(f"/api/v1/urls/{slug}", headers=other)).status_code == 404
        assert (await client.get(f"/api/v1/analytics/{slug}", headers=other)).status_code == 404

    async def test_top_urls_only_include_own_links(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        await client.post("/api/v1/urls/", json=url_payload, headers=auth_headers)
        other = await _other_user_headers(client)

        own = await client.get("/api/v1/analytics/top/urls", headers=auth_headers)
        assert len(own.json()) == 1
        others = await client.get("/api/v1/analytics/top/urls", headers=other)
        assert others.json() == []

    async def test_top_urls_requires_auth(self, client: AsyncClient):
        assert (await client.get("/api/v1/analytics/top/urls")).status_code == 401

    async def test_same_url_is_separate_link_per_user(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        first = (await client.post("/api/v1/urls/", json=url_payload, headers=auth_headers)).json()
        other = await _other_user_headers(client)
        second = (await client.post("/api/v1/urls/", json=url_payload, headers=other)).json()
        assert first["slug"] != second["slug"]
        assert first["owner_id"] != second["owner_id"]


@pytest.mark.asyncio
class TestURLEdgeCases:
    async def test_delete_url_with_recorded_clicks(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict, db_session
    ):
        from app.models import URLAnalytics
        from app.repositories.url_repository import URLRepository

        slug = (await client.post("/api/v1/urls/", json=url_payload, headers=auth_headers)).json()["slug"]
        url = await URLRepository(db_session).get_by_slug(slug)
        db_session.add(URLAnalytics(url_id=url.id, browser="Chrome"))
        await db_session.commit()

        response = await client.delete(f"/api/v1/urls/{slug}", headers=auth_headers)
        assert response.status_code == 200

    async def test_custom_alias_not_swallowed_by_deduplication(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        await client.post("/api/v1/urls/", json=url_payload, headers=auth_headers)
        response = await client.post(
            "/api/v1/urls/", json={**url_payload, "custom_alias": "my-alias"}, headers=auth_headers
        )
        assert response.status_code == 201
        assert response.json()["slug"] == "my-alias"

    async def test_update_can_clear_title_and_expiry(
        self, client: AsyncClient, auth_headers: dict, url_payload: dict
    ):
        payload = {**url_payload, "expires_at": "2099-01-01T00:00:00Z"}
        slug = (await client.post("/api/v1/urls/", json=payload, headers=auth_headers)).json()["slug"]
        response = await client.patch(
            f"/api/v1/urls/{slug}",
            json={"title": None, "expires_at": None, "long_url": None, "is_active": None},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] is None
        assert data["expires_at"] is None
        assert data["long_url"] == url_payload["long_url"]
        assert data["is_active"] is True

    async def test_reserved_alias_rejected(self, client: AsyncClient, auth_headers: dict):
        response = await client.post(
            "/api/v1/urls/",
            json={"long_url": "https://example.com", "custom_alias": "docs"},
            headers=auth_headers,
        )
        assert response.status_code == 422
