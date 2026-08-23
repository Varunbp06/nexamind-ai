"""Shared-secret guard for publicly exposed deployments.

When INTERNAL_API_TOKEN is set, every request must carry a matching
``x-internal-token`` header. Health/documentation endpoints stay reachable so
uptime checks and Swagger still work. When the variable is unset the guard is
inert and behavior is identical to previous versions (local development).
"""

import hmac
import os

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

INTERNAL_TOKEN_HEADER = "x-internal-token"

# Paths that remain reachable without the shared secret (health probes,
# OpenAPI schema/Swagger UI). Everything else requires the token.
EXEMPT_PATHS = ("/health", "/docs", "/openapi.json", "/redoc")


def internal_token() -> str | None:
    return os.getenv("INTERNAL_API_TOKEN") or None


class InternalTokenMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        expected = internal_token()
        if expected:
            path = request.url.path
            if not path.startswith(EXEMPT_PATHS):
                provided = request.headers.get(INTERNAL_TOKEN_HEADER, "")
                if not provided or not hmac.compare_digest(provided, expected):
                    return JSONResponse(
                        {"code": 401, "message": "Unauthorized", "data": None},
                        status_code=401,
                    )
        return await call_next(request)
