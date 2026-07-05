# Decision Intelligence Platform

AI-Powered Decision Intelligence Platform — Cloud-Native, GPU-Accelerated, Multi-Persona.

## Personas

| Persona | User | Domain | Metrics |
|---------|------|--------|---------|
| Supply Chain | Alex Chen — Operations Manager | Inventory & replenishment | `quantity`, `unit_price` |
| Transportation | Maya Patel — Fleet Director | Route & transit logistics | `transit_minutes`, `distance_km` |
| Health | James Okonkwo — Public Health Officer | Case response & facilities | `case_count`, `response_hours` |

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │ Identity  │→│ Pipeline  │→│ Accel     │→│ Decision Output    │ │
│  │ & Data    │  │ Build     │  │ Metrics   │  │ (Alerts/Forecasts)│ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘ │
│                                    ┌──────────────────────────────┐  │
│                                    │  NLQ Query Bar (Gemini AI)   │  │
│                                    └──────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│                       NVIDIA ACCELERATION LAYER                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  cudf / cudf.pandas  │  GPU Benchmark Comparison (CPU vs GPU)│  │
│  └───────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│                       GOOGLE CLOUD DATA LAYER                         │
│  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ CSV    │  │ JSON     │  │ Text     │  │ GCS      │  │ BigQuery │ │
│  │ Txns   │→│ Logs     │→│ Reports  │→│ Bucket   │→│ Tables   │ │
│  └────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## Key Features

### Multi-Source Ingestion
- **CSV Transactions** — structured order data per persona
- **JSON Logs** — semi-structured event streams
- **Text Reports** — unstructured incident reports for NLP analysis

### Natural Language Query (NLQ) Bar
Ask questions in plain English about your pipeline data:
- *"What anomalies were found?"*
- *"Show me the demand forecast for Widget-A"*
- *"What is the current decision bottleneck?"*

Powered by **Gemini AI** with rule-based fallback when no API key is configured.

### GPU Acceleration Proof
Animated CPU vs GPU benchmark comparison bars demonstrate:
- Feature aggregation: **5.3× speedup** with cudf
- Trend joins: **4.7× speedup**
- Anomaly detection: **7.0× speedup**

### Decision Hub
- **Anomaly Detection** — z-score based with pulsating visual indicators
- **Predictive Alerts** — severity-categorized (CRITICAL / WARNING / INFO)
- **Demand Forecasts** — exponential smoothing with confidence intervals
- **LLM Recommendations** — Gemini-generated actionable priorities

## Project Structure

```
decision-intelligence-platform/
├── backend/
│   ├── config.py                 # 12-factor env config
│   ├── auth.py                   # JWT + bcrypt auth module
│   ├── persona_config.py         # Per-persona schema & threshold config
│   ├── pipeline.py               # End-to-end orchestrator
│   ├── server.py                 # Flask API — secured, cached, rate-limited
│   ├── cloud_io.py               # GCS + BigQuery I/O abstraction
│   ├── ingest/
│   │   ├── landing_zone.py       # CSV landing zone
│   │   ├── multi_source.py       # JSON logs + text reports per persona
│   │   ├── normalizer.py         # Schema-adaptive normalisation
│   │   ├── deduplicator.py       # Exact + fuzzy dedup
│   │   └── filter.py             # Bad-record filtering
│   ├── analyze/
│   │   ├── feature_agg.py        # Feature aggregation (cudf)
│   │   ├── trend_join.py         # Date-window trend features
│   │   ├── anomaly_detection.py  # Z-score anomaly detection (cudf)
│   │   └── benchmark.py          # CPU vs GPU benchmark harness
│   └── decision/
│       ├── alert_engine.py       # Business alert generation
│       ├── forecast.py           # Exponential smoothing forecast
│       └── llm_recommend.py      # Gemini API recommendation
├── decision-ui/                  # React + Vite + Framer Motion frontend
├── data/                         # Data directories (auto-generated)
├── tests/
│   ├── test_ingest.py
│   ├── test_analyze.py
│   └── test_decision.py
├── Dockerfile                    # CPU multi-stage build
├── Dockerfile.gpu                # GPU-accelerated variant (RAPIDS)
├── Dockerfile.dev                # Dev hot-reload build
├── docker-compose.yml            # Local dev orchestration
├── cloudbuild.yaml               # Cloud Build CI/CD config
├── render.yaml                   # Render platform deploy config
├── .env.example
├── requirements.txt
├── setup.py
├── pyproject.toml                # Linter config
├── .pre-commit-config.yaml
├── .dockerignore
└── .gitignore
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- A `.env` file (copy `.env.example` → `.env` and fill in **all REQUIRED** keys)

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies & Build
```bash
cd decision-ui
npm install
npm run build
cd ..
```

### 3. Run Backend
```bash
python -m backend.server
```

### 4. Run Frontend Dev Server
```bash
cd decision-ui
npm run dev
```

Open `http://localhost:5173` in your browser.

### 5. (Optional) Enable LLM & NLQ
Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_key_here
```
Get a key at https://aistudio.google.com/apikey

### 6. (Optional) Enable GPU Acceleration
```bash
conda install -c rapidsai cudf
```
Set `CUDF_ENABLED=1` in `.env`.

## Deploy

### Frontend → Vercel (free)
```bash
cd decision-ui
vercel --prod
```
No env vars needed — SPA uses same-origin proxy.

### Backend → Render (free)
1. Push repo to GitHub
2. Create Render Web Service → select repo
3. `render.yaml` auto-detected — set these env vars:

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | Yes | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `CORS_ORIGINS` | Yes | Your Vercel URL |
| `AUTH_PASSWORD` | Yes | Strong admin password |
| `GEMINI_API_KEY` | No | For AI recommendations |

### Google Cloud Run
```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_PROJECT_ID=your-project-id,_REGION=us-central1,_JWT_SECRET=...,_CORS_ORIGINS=...,_AUTH_PASSWORD=...
```

## Testing
```bash
pytest tests/ -v
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/health` | GET | No | Health check |
| `/api/auth/login` | POST | No | Login (returns JWT token) |
| `/api/auth/logout` | POST | Yes | Revoke token |
| `/api/run-pipeline` | POST | Yes | Execute pipeline for selected persona |
| `/api/results` | GET | Yes | Latest recommendation results |
| `/api/benchmarks` | GET | Yes | CPU vs GPU benchmark data |
| `/api/query` | POST | Yes | Natural language question |

## Cloud-Native Principles

- **12-factor config**: Environment-injected via `config.py`; app crashes at startup if `JWT_SECRET`, `CORS_ORIGINS`, or `AUTH_PASSWORD` are missing
- **Immutable data**: Each pipeline stage writes new files; never mutates input
- **Stateless API**: Server has no in-memory state; data lives on disk
- **Isolated components**: Each module has a single responsibility
- **GPU graceful fallback**: Falls back to pandas if cudf unavailable
- **LLM graceful fallback**: Falls back to rule-based responses if no API key
- **Containerized**: Multi-stage Docker build; `docker-compose.yml` for local dev
- **CI/CD ready**: `cloudbuild.yaml` + GitHub Actions (`.github/workflows/ci.yml`)
- **Secure by default**: JWT auth + rate limiting + XSS sanitisation + security headers + graceful shutdown
