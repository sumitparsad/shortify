"""
Request ID middleware.

Assigns a unique UUID to every incoming request and injects it into:
- request.state.request_id (accessible in route handlers)
- X-Request-ID response header (visible to clients for support tickets)
- structlog context (all log lines in a request share the same ID)

This is essential for distributed tracing. When 10 replicas are running,
you can grep all logs for a single request ID and see the full trace.
"""

import uuid

import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Bind to structlog context so all logs in this request include request_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
