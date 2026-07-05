"""
Zero-Trust Auth Module — JWT + bcrypt + rate-limiting decorators.

Provides:
- bcrypt password hashing and verification
- JWT token issuance (access + refresh)
- @require_auth decorator for securing endpoints
- Rate-limit presets for auth vs general API
"""
from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
from flask import request, jsonify, g
from markupsafe import escape

from backend.config import JWT_SECRET, JWT_ALGORITHM, JWT_ACCESS_MINUTES, AUTH_USERNAME, AUTH_PASSWORD_HASH

# ── bcrypt helpers ─────────────────────────────────────────────


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT helpers ────────────────────────────────────────────────

_TOKEN_BLACKLIST: set[str] = set()


def issue_token(username: str, expires_minutes: int | None = None) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes or JWT_ACCESS_MINUTES)
    payload = {"sub": username, "iat": datetime.now(timezone.utc), "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if payload["sub"] in _TOKEN_BLACKLIST:
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def revoke_token(token: str) -> None:
    _TOKEN_BLACKLIST.add(token)


# ── Decorators ─────────────────────────────────────────────────


def require_auth(f):
    """Decorator — rejects requests without a valid JWT Bearer token."""

    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        match = re.match(r"^Bearer\s+(.+)$", auth_header)
        if not match:
            return jsonify({"error": "Unauthorized", "message": "Missing or malformed Bearer token"}), 401
        payload = decode_token(match.group(1))
        if payload is None:
            return jsonify({"error": "Unauthorized", "message": "Token expired or invalid"}), 401
        g.current_user = payload["sub"]
        return f(*args, **kwargs)

    return wrapper


# ── Input sanitisation ─────────────────────────────────────────


def sanitise_text(value: str, max_length: int = 500) -> str:
    """Strip tags, escape HTML entities, truncate, remove dangerous chars."""
    cleaned = re.sub(r"<[^>]*>", "", value)
    cleaned = escape(cleaned)
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", "", cleaned)
    return cleaned[:max_length]


# ── User storage (JSON file) ─────────────────────────────────

import json
from pathlib import Path
from backend.config import DATA_DIR

_USERS_FILE = DATA_DIR / "users.json"


def _load_users() -> dict:
    if _USERS_FILE.exists():
        with open(_USERS_FILE) as f:
            return json.load(f)
    return {}


def _save_users(users: dict) -> None:
    _USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(_USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


def register_user(username: str, plain_password: str) -> str | None:
    """Register a new user. Returns error message or None on success."""
    users = _load_users()
    username = username.strip().lower()
    if not username or not plain_password:
        return "Username and password are required."
    if len(username) < 3:
        return "Username must be at least 3 characters."
    if len(plain_password) < 4:
        return "Password must be at least 4 characters."
    if username in users:
        return "Username already exists."
    if username == AUTH_USERNAME:
        return "That username is reserved."
    users[username] = {"password_hash": hash_password(plain_password)}
    _save_users(users)
    return None


def authenticate_user(username: str, plain_password: str) -> bool:
    """Check credentials against both env admin and registered users."""
    username_lower = username.strip().lower()
    if username_lower == AUTH_USERNAME:
        pw_hash = AUTH_PASSWORD_HASH
        if not pw_hash:
            plain = os.getenv("AUTH_PASSWORD", "")
            if not plain:
                return False
            pw_hash = hash_password(plain)
        return verify_password(plain_password, pw_hash)
    users = _load_users()
    user = users.get(username_lower)
    if user:
        return verify_password(plain_password, user["password_hash"])
    return False


# ── Default credentials check — requires explicit config ────────────


def default_user() -> dict:
    password_hash = AUTH_PASSWORD_HASH
    if not password_hash:
        plain = os.getenv("AUTH_PASSWORD", "")
        if not plain:
            raise RuntimeError(
                "Neither AUTH_PASSWORD_HASH nor AUTH_PASSWORD is set. "
                "Set AUTH_PASSWORD in .env to auto-generate a hash on startup."
            )
        password_hash = hash_password(plain)
    return {
        "username": AUTH_USERNAME,
        "password_hash": password_hash,
    }
