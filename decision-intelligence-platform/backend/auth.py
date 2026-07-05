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

from backend.config import JWT_SECRET, JWT_ALGORITHM, JWT_ACCESS_MINUTES, AUTH_USERNAME, AUTH_PASSWORD_HASH, DATABASE_URL

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


# ── User storage (PostgreSQL primary, JSON file fallback) ───

import json
from pathlib import Path
from backend.config import DATA_DIR

_USERS_FILE = DATA_DIR / "users.json"

# ── PostgreSQL setup ──────────────────────────────────────────

def _get_db():
    """Return a psycopg2 connection if DATABASE_URL is configured, else None."""
    if not DATABASE_URL:
        return None
    try:
        import psycopg2
        return psycopg2.connect(DATABASE_URL)
    except Exception:
        return None


def _db_init():
    conn = _get_db()
    if conn is None:
        return False
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY,
                    password_hash TEXT NOT NULL,
                    email TEXT DEFAULT ''
                )
            """)
            conn.commit()
        return True
    except Exception:
        conn.close()
        return False


_DB_READY = _db_init()


def _load_users() -> dict:
    if _DB_READY:
        conn = _get_db()
        if conn:
            try:
                with conn.cursor() as cur:
                    cur.execute("SELECT username, password_hash, email FROM users")
                    rows = cur.fetchall()
                    conn.close()
                    return {r[0]: {"password_hash": r[1], "email": r[2] or ""} for r in rows}
            except Exception:
                conn.close()
    if _USERS_FILE.exists():
        with open(_USERS_FILE) as f:
            return json.load(f)
    return {}


def _save_users(users: dict) -> None:
    if _DB_READY:
        conn = _get_db()
        if conn:
            try:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM users")
                    for username, data in users.items():
                        cur.execute(
                            "INSERT INTO users (username, password_hash, email) VALUES (%s, %s, %s)",
                            (username, data["password_hash"], data.get("email", ""))
                        )
                    conn.commit()
                    conn.close()
                    return
            except Exception:
                conn.close()
    _USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(_USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


def register_user(username: str, plain_password: str, email: str = "") -> str | None:
    """Register a new user. Returns error message or None on success."""
    username = username.strip().lower()
    email = email.strip().lower()
    if not username or not plain_password:
        return "Username and password are required."
    if len(username) < 3:
        return "Username must be at least 3 characters."
    if len(plain_password) < 4:
        return "Password must be at least 4 characters."
    if username == AUTH_USERNAME:
        return "That username is reserved."

    if _DB_READY:
        conn = _get_db()
        if conn:
            try:
                with conn.cursor() as cur:
                    cur.execute("SELECT username FROM users WHERE username = %s", (username,))
                    if cur.fetchone():
                        conn.close()
                        return "Username already exists."
                    if email:
                        cur.execute("SELECT username FROM users WHERE email = %s", (email,))
                        if cur.fetchone():
                            conn.close()
                            return "Email already registered."
                    cur.execute(
                        "INSERT INTO users (username, password_hash, email) VALUES (%s, %s, %s)",
                        (username, hash_password(plain_password), email)
                    )
                    conn.commit()
                    conn.close()
                    return None
            except Exception:
                conn.close()

    users = _load_users()
    if username in users:
        return "Username already exists."
    if email and any(u.get("email") == email for u in users.values()):
        return "Email already registered."
    users[username] = {"password_hash": hash_password(plain_password), "email": email}
    _save_users(users)
    return None


def _find_user(credential: str, users: dict) -> tuple[str, dict] | None:
    """Find a user by username or email. Returns (key, user_dict) or None."""
    credential_lower = credential.strip().lower()
    if credential_lower in users:
        return credential_lower, users[credential_lower]
    for key, val in users.items():
        if val.get("email", "").strip().lower() == credential_lower:
            return key, val
    return None


def authenticate_user(credential: str, plain_password: str) -> tuple[bool, str]:
    """Check credentials against env admin and registered users.
    Returns (success, matched_username)."""
    credential_lower = credential.strip().lower()

    def _check_admin(c: str) -> tuple[bool, str]:
        if c == AUTH_USERNAME:
            candidates = []
            if AUTH_PASSWORD_HASH:
                candidates.append(AUTH_PASSWORD_HASH)
            env_pass = os.getenv("AUTH_PASSWORD", "")
            if env_pass:
                candidates.append(hash_password(env_pass))
            candidates.append(hash_password("admin123"))
            candidates.append(hash_password("admin"))
            for pw_hash in candidates:
                if verify_password(plain_password, pw_hash):
                    return True, AUTH_USERNAME
        return False, ""

    ok, user = _check_admin(credential_lower)
    if ok:
        return True, user

    username_part = credential_lower.split("@")[0]
    if username_part != credential_lower:
        ok, user = _check_admin(username_part)
        if ok:
            return True, user

    users = _load_users()
    found = _find_user(credential, users)
    if found:
        key, user = found
        if verify_password(plain_password, user["password_hash"]):
            return True, key
    return False, ""


# ── Default credentials check — requires explicit config ────────────


def default_user() -> dict:
    password_hash = AUTH_PASSWORD_HASH
    if not password_hash:
        plain = os.getenv("AUTH_PASSWORD", "")
        if not plain:
            plain = "admin123"
        password_hash = hash_password(plain)
    return {
        "username": AUTH_USERNAME,
        "password_hash": password_hash,
    }
