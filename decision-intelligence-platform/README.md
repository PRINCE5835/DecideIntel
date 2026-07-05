# Decision Intelligence Platform

AI-Powered Decision Intelligence Platform — Cloud-Native, GPU-Accelerated, Decision-First.

## Real User

**Alex Chen — Supply Chain Operations Manager**

## Decision Bottleneck

**Inventory replenishment decision latency > 4 hours** — resolved through automated pipeline acceleration and LLM-powered recommendations.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │ Identity  │→│ Pipeline  │→│ Accel     │→│ Decision Output    │ │
│  │ & Data    │  │ Build     │  │ Metres    │  │ (Alerts/Forecasts)│ │
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
- **CSV Transactions** — structured supply-chain order data (5 files, 2000 rows each)
- **JSON Logs** — semi-structured microservice event streams (3 files, 100 lines each)
- **Text Reports** — unstructured incident reports for NLP analysis (3 files)

### Natural Language Query (NLQ) Bar
Ask questions in plain English about your pipeline data:
- *"What anomalies were found?"*
- *"Show me the demand forecast for Widget-A"*
- *"What is the current decision bottleneck?"*

Powered by **Gemini AI** with a rule-based fallback when no API key is configured.

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
│   ├── pipeline.py               # End-to-end orchestrator
│   ├── server.py                 # Flask API + NLQ /api/query endpoint
│   ├── cloud_io.py               # GCS + BigQuery I/O abstraction
│   ├── ingest/
│   │   ├── landing_zone.py       # CSV transaction landing zone
│   │   ├── multi_source.py       # JSON logs + text reports landing zones
│   │   ├── normalizer.py         # Schema normalisation
│   │   ├── deduplicator.py       # Exact + fuzzy dedup
│   │   └── filter.py             # Bad-record filtering
│   ├── analyze/
│   │   ├── feature_agg.py        # Feature aggregation (cudf)
│   │   ├── trend_join.py         # Real date-window trend features
│   │   ├── anomaly_detection.py  # Z-score anomaly detection (cudf)
│   │   └── benchmark.py          # CPU vs GPU benchmark harness
│   └── decision/
│       ├── alert_engine.py       # Business alert generation
│       ├── forecast.py           # Exponential smoothing forecast
│       └── llm_recommend.py      # Gemini API recommendation
├── decision-ui/                  # React + Vite + Framer Motion frontend
│   ├── src/
│   │   ├── App.jsx               # Beat navigation
│   │   ├── components/
│   │   │   ├── Header.jsx        # NLQ bar + nav
│   │   │   ├── Beat1_Persona.jsx # Persona selection
│   │   │   ├── Beat2_Pipeline.jsx# Pipeline + GPU/CPU benchmarks
│   │   │   └── Beat3_DecisionHub.jsx # Alerts, forecasts, LLM
│   │   └── data/mockData.js
│   └── package.json
├── data/                         # Data directories (local GCS mock)
├── tests/
│   ├── test_ingest.py
│   ├── test_analyze.py
│   └── test_decision.py
├── Dockerfile                    # Multi-stage Cloud Run build
├── Dockerfile.gpu                # GPU-accelerated variant (RAPIDS)
├── cloudbuild.yaml               # Cloud Build CI/CD config
├── .env.example
├── requirements.txt
└── setup.py
```

## Quick Start

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

Open `http://localhost:3000` in your browser.

### 5. (Optional) Enable LLM & NLQ

Copy `.env.example` → `.env` and add your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

Get a key at https://aistudio.google.com/apikey

### 6. (Optional) Enable GPU Acceleration

```bash
conda install -c rapidsai cudf
```

Set `CUDF_ENABLED=1` in `.env`.

## Deploy to Google Cloud Run

```bash
# Build and deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_PROJECT_ID=your-project-id,_REGION=us-central1
```

Or build locally:

```bash
docker build -t decision-intel-platform .
docker run -p 8080:8080 decision-intel-platform
```

## Testing

```bash
pytest tests/ -v
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/query` | POST | Natural language question about pipeline data |
| `/api/run-pipeline` | POST | Execute the full data pipeline |
| `/api/results` | GET | Latest recommendation results |
| `/api/benchmarks` | GET | CPU vs GPU benchmark data |

## Cloud-Native Principles

- **12-factor config**: Environment-injected via `config.py`
- **Immutable data**: Each pipeline stage writes new files; never mutates input
- **Stateless API**: Server has no in-memory state; data lives on disk/local GCS
- **Isolated components**: Each module has a single responsibility
- **GPU graceful fallback**: Falls back to pandas if cudf unavailable
- **LLM graceful fallback**: Falls back to rule-based responses if no API key
- **Containerized**: Multi-stage Docker build for Cloud Run deployment
- **CI/CD ready**: `cloudbuild.yaml` for automated GCP builds
