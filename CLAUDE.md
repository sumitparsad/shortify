# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Monorepo with two independent apps (no root-level tooling):

- `shortify_backend/` — FastAPI (Python 3.11+/3.12) + async SQLAlchemy (PostgreSQL/asyncpg) + Redis + JWT auth
- `shortify_frontend/` — React 19 + TypeScript + Vite + Tailwind v4 + TanStack Query v5 + Zustand

Deployment: frontend on Vercel (root `shortify_frontend`, `vercel.json` rewrites everything to `index.html`), backend on Render (root `shortify_backend`), Postgres on Neon, Redis on Upstash.

## Commands

### Backend (run from `shortify_backend/`)

```bash
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000      # API docs at /docs
docker compose up                               # api + postgres:16 + redis:7

pytest                                          # all tests (coverage gate: --cov-fail-under=70)
pytest tests/unit/test_url_service.py           # one file
pytest tests/integration/test_urls.py::test_name  # one test
pytest --no-cov tests/unit                      # skip coverage (avoids fail-under on partial runs)
alembic revision --autogenerate -m "msg"        # new migration
```

`pytest.ini` sets `asyncio_mode = auto`, so async tests need no decorator. Tests need no running Postgres or Redis: `tests/conftest.py` uses a per-test in-memory SQLite DB (`aiosqlite`) and a dict-backed `MagicMock` Redis, injected via `app.dependency_overrides[get_db]` / `[get_redis]`. Fixtures `registered_user` and `auth_headers` give an authenticated client. Keep models SQLite-compatible for tests. The rate-limit middleware still talks to real Redis: with none running, every request waits on a failed connection and the suite takes about 7 minutes. With the Docker Redis up, it takes about a minute, but run it as `RATE_LIMIT_REQUESTS=1000000 pytest` so the suite doesn't hit 429s.

### Frontend (run from `shortify_frontend/`)

```bash
npm install
cp .env.example .env.local    # VITE_API_BASE_URL, VITE_SHORT_URL_BASE
npm run dev                   # http://localhost:5173
npm run build                 # tsc -b && vite build (type-check is part of build)
npm run lint                  # oxlint
```

No frontend test runner is configured. Path alias `@` → `src/`.

## Backend architecture

Layering: `api/v1/endpoints` → `services` → `repositories` → `models`. Endpoints construct services per request via small `Depends` factories (e.g. `_get_url_service(db, redis)` returning `URLService(db, RedisCache(redis))`). Business errors are raised as custom exceptions (`app/exceptions/*`) and mapped to HTTP responses in `exceptions/handlers.py` with the shape `{"success": false, "error": ..., "details"?, "request_id"?}` — the frontend's `extractErrorMessage` in `src/lib/api/client.ts` depends on this shape (plus FastAPI's `{detail}`).

Key cross-file behaviors:

- **Routing order matters.** `main.py` mounts `api_router` (`/api/v1/...`) first and the redirect router (`GET /{slug}`) last. System paths are listed in `RESERVED_SLUGS` (`app/schemas/url.py`), which both the redirect route and custom-alias validation use. New top-level routes must be registered before the redirect router and added to that set.
- **Short links are served by the backend**, not the frontend: `short_url = f"{settings.BASE_URL}/{slug}"` (built in `URLService._to_response`). The frontend displays `url.short_url` from the API as-is; the SPA has no slug route.
- **Redirect path** (`URLService.redirect`): Redis `url:slug:{slug}` (TTL 1h) → Postgres on miss → 302. Click recording (`click_count` increment + `url_analytics` row) runs as a FastAPI `BackgroundTask` using its own `AsyncSessionLocal` session (not the request session). A cache hit skips the `is_active`/`expires_at` checks, so `_cache_long_url` caps the TTL at the link's expiry, and any change to a URL's `long_url`/`is_active`/expiry must invalidate the cache key (`update_url`/`delete_url` do this).
- **Per-user isolation**: every URL/analytics read or write is scoped to the current user. Another user's slug returns 404, not 403, so its existence isn't revealed (`URLService._get_owned_url`, `AnalyticsService.get_url_analytics`). `/analytics/top/urls` is filtered by owner. Slugs are globally unique because redirects are public.
- **Create URL**: without a custom alias, it dedupes per owner by SHA-256 `url_hash`. With an alias, repeating the same owner+alias+URL is idempotent; otherwise a taken alias is a 409.
- **Redis is treated as optional**: `RedisCache` swallows errors, and `RateLimitMiddleware` (per-IP `INCR`+`EXPIRE`) fails open. Client IPs come only from `get_client_ip` in `utils/request_parser.py`, which trusts `X-Forwarded-For` entries only from the last `TRUSTED_PROXY_HOPS` proxies (the leftmost entries are spoofable). The middleware and lifespan call `get_redis_pool()` directly, not the `get_redis` dependency, so test overrides don't apply to them. All Redis key builders live in `app/core/redis.py`.
- **Auth**: bcrypt + python-jose access (30 min) / refresh (7 days) tokens. Refresh tokens are single-use: `refresh` blocklists the old token's `jti`, and so does logout (`auth:blocklist:{jti}`, TTL = the token's remaining lifetime). The blocklist is checked in `AuthService.get_current_user` and `refresh`. Login compares against `DUMMY_PASSWORD_HASH` for unknown emails so timing doesn't reveal registered accounts. Use the `CurrentUser` / `AdminUser` / `DBSession` `Annotated` aliases from `app/dependencies/auth.py` in route signatures.
- **Schema**: Alembic migrations live in `alembic/versions/`, but `main.py`'s lifespan also runs `Base.metadata.create_all` on startup. New models must be imported in `app/models/__init__.py` for both to see them. `create_all` does not alter existing tables, so column changes still need a migration.
- **Config**: `app/core/config.py` (pydantic-settings, reads `.env`, case-sensitive). `DATABASE_URL` (asyncpg) and `SYNC_DATABASE_URL` (psycopg, used by Alembic) are derived from the `DATABASE_*` parts. `CORS_ORIGINS` is a comma-separated string.

## Frontend architecture

- `src/router.tsx`: `createBrowserRouter`; `/dashboard` and `/links/:slug` (per-link analytics) are wrapped in `AuthGuard`.
- Auth: `store/auth.store.ts` (Zustand) keeps the access token in memory and the refresh token in `localStorage` (`shortify_refresh_token`). `AuthGuard` rehydrates the session on load. `clearSession` (and `setSession` for a different user) calls `queryClient.clear()` from `lib/queryClient.ts` so one account never sees another's cached data. Navigate with `useNavigate`, not `window.location`, because a full reload drops the in-memory token.
- `lib/api/client.ts`: a shared axios instance. It attaches the bearer token; on a 401 it calls `refreshSession()` and retries. `refreshSession()` is the only way to refresh: it shares one in-flight request between the interceptor, `AuthGuard` and StrictMode's double effects, because refresh tokens are single-use and a second request with the same token would log the user out. API functions live in `lib/api/*.ts`, types in `types/`, and zod form schemas in `lib/validators/`.
- Server state goes through TanStack Query hooks in `hooks/` (query keys `["urls", page, size]`, `["url", slug]`, `["analytics", slug]`, `["top-urls", limit]`). Link status uses `isLinkLive` in `lib/utils.ts`: a link counts as active only if `is_active` is true and it hasn't expired. Use it for every active/inactive count or filter. URL update/delete mutations patch the cached lists in place with `setQueriesData`, so deactivated links stay visible. Keep that behavior when changing them.
- UI: shadcn-style setup (`components.json`, `cva`, `tailwind-merge`); theme tokens in `src/index.css`; light/dark/system theme via `store/theme.store.ts`. Charts use Recharts, QR codes use `qrcode.react`, toasts use `sonner`.
