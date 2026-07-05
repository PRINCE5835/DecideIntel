"""
Decision Intelligence Platform — Central Configuration.

Follows cloud-native 12-factor app principles:
- Config via environment (with .env fallback)
- Immutable, injected at startup
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# ── Google Cloud / GCS (simulated via local paths) ──────────────────────
GCS_BUCKET = os.getenv("GCS_BUCKET", "decision-intel-landing")
GCS_PROJECT = os.getenv("GCS_PROJECT", "decision-intel-prod")
GCS_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")

# ── Data paths (mimics Cloud Storage / BigQuery table structure) ───────
DATA_DIR = Path(os.getenv("DATA_DIR", PROJECT_ROOT / "data"))
RAW_DIR = DATA_DIR / "raw"
NORMALIZED_DIR = DATA_DIR / "normalized"
FEATURES_DIR = DATA_DIR / "features"
DECISIONS_DIR = DATA_DIR / "decisions"

for d in [RAW_DIR, NORMALIZED_DIR, FEATURES_DIR, DECISIONS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ── RAPIDS / GPU ──────────────────────────────────────────────────────
CUDF_ENABLED = os.getenv("CUDF_ENABLED", "0") == "1"
CUDA_VISIBLE_DEVICES = os.getenv("CUDA_VISIBLE_DEVICES", "0")

# ── Gemini / LLM ──────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# ── Pipeline ──────────────────────────────────────────────────────────
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "10000"))
PARQUET_COMPRESSION = os.getenv("PARQUET_COMPRESSION", "snappy")

# ── JWT / Auth / Security ────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required. Generate one via: python -c \"import secrets; print(secrets.token_hex(32))\"")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_MINUTES = int(os.getenv("JWT_ACCESS_MINUTES", "60"))
AUTH_USERNAME = os.getenv("AUTH_USERNAME", "admin")
AUTH_PASSWORD_HASH = os.getenv("AUTH_PASSWORD_HASH", "")

# ── Flask server ──────────────────────────────────────────────────────
FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
FLASK_PORT = int(os.getenv("FLASK_PORT", "8080"))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

# ── Rate limiting ────────────────────────────────────────────────────
RATELIMIT_AUTH = os.getenv("RATELIMIT_AUTH", "5 per minute")
RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "100 per minute")

# ── Caching ──────────────────────────────────────────────────────────
CACHE_TYPE = os.getenv("CACHE_TYPE", "SimpleCache")
CACHE_DEFAULT_TIMEOUT = int(os.getenv("CACHE_DEFAULT_TIMEOUT", "120"))
CACHE_KEY_PREFIX = os.getenv("CACHE_KEY_PREFIX", "di_")

# ── Supabase / Neon (deployment) ─────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
