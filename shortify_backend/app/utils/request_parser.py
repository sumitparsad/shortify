"""
Utilities for extracting analytics metadata from HTTP requests.

Extracts: IP address, User-Agent (browser/OS/device), referrer.
Country detection requires MaxMind GeoIP2 — we provide a stub here
that can be replaced with a real implementation.

PRIVACY CONSIDERATIONS:
- IP addresses are PII in GDPR regions
- We store a hashed IP (visitor_hash) for unique visitor counting
  without storing the raw IP persistently
- Store raw IP only if legally required and only with user consent

PRODUCTION ALTERNATIVE:
- CloudFlare sets CF-IPCountry header → free country detection
- AWS CloudFront sets CloudFront-Viewer-Country
- X-Vercel-IP-Country for Vercel deployments
"""

import hashlib
from fastapi import Request

try:
    from user_agents import parse as ua_parse
    UA_AVAILABLE = True
except ImportError:
    UA_AVAILABLE = False


def get_client_ip(request: Request) -> str:
    """Extract real client IP, considering reverse proxy headers."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


def hash_ip(ip: str) -> str:
    """
    One-way hash of IP for unique visitor tracking without storing raw IPs.
    Salt prevents rainbow table attacks on the hash.
    """
    salt = "urlshortener-v1"  # Rotate this periodically for privacy
    return hashlib.sha256(f"{salt}:{ip}".encode()).hexdigest()


def parse_user_agent(user_agent_string: str | None) -> dict:
    """Parse browser, OS, and device type from User-Agent string."""
    if not user_agent_string or not UA_AVAILABLE:
        return {"browser": None, "os": None, "device": None}

    try:
        ua = ua_parse(user_agent_string)
        device = "mobile" if ua.is_mobile else "tablet" if ua.is_tablet else "desktop"
        return {
            "browser": ua.browser.family,
            "os": ua.os.family,
            "device": device,
        }
    except Exception:
        return {"browser": None, "os": None, "device": None}


def extract_request_meta(request: Request) -> dict:
    """
    Extract all analytics-relevant metadata from an HTTP request.
    Returns a dict passed to the analytics background task.
    """
    ip = get_client_ip(request)
    ua_string = request.headers.get("User-Agent")
    ua_data = parse_user_agent(ua_string)

    return {
        "ip": ip,
        "visitor_hash": hash_ip(ip),
        # Country detection: in production, use CF-IPCountry or MaxMind
        "country": request.headers.get("CF-IPCountry"),
        "city": None,
        "browser": ua_data["browser"],
        "os": ua_data["os"],
        "device": ua_data["device"],
        "referrer": request.headers.get("Referer"),
        "user_agent": ua_string,
    }
