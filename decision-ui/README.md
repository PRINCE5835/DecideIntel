<div align="center">

# 🧠 Decision Intelligence UI

**React · Vite · Tailwind CSS · Framer Motion · Recharts**

[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?logo=framer&logoColor=white)](https://framermotion.framer.website)
[![Recharts](https://img.shields.io/badge/Recharts-Charts-22B5BF?logo=chartdotjs&logoColor=white)](https://recharts.org)

</div>

---

A light‑themed, professional decision analytics dashboard that powers the **Decision Intelligence Platform**. Three personas, three pipeline beats, one seamless experience.

---

## ✨ Features

### 🔐 Secure Login
JWT‑backed authentication with bcrypt password hashing. Token persisted in `localStorage` with automatic 401 redirect and session expiry.

### 👥 Multi‑Persona Selector
Choose your domain — **Supply Chain**, **Transportation**, or **Health** — and the entire dashboard adapts: data schema, analysis thresholds, alert topics, and LLM context all switch automatically.

### ⚡ Live Pipeline Execution
Run the full ETL + analysis pipeline with one click. Watch real‑time progress as data flows through ingestion → normalization → dedup → filtering → feature aggregation → anomaly detection → alert generation.

### 📈 CPU vs GPU Benchmark Comparison
Animated side‑by‑side bars using **Recharts** show the raw performance gap:

| Operation | CPU | GPU | Speedup |
|-----------|-----|-----|---------|
| Feature Agg | 2.3s | 0.43s | **5.3×** |
| Trend Joins | 1.8s | 0.38s | **4.7×** |
| Anomaly Detect | 3.1s | 0.44s | **7.0×** |

### 🎯 Decision Hub
- **Pulsating anomaly indicators** — severity color‑coded (CRITICAL red, WARNING amber, INFO blue)
- **Demand forecasts** — exponential smoothing with confidence bands
- **LLM recommendations** — Gemini‑powered actionable priorities
- **Alert timeline** — automatically generated from detected anomalies

### 🗣️ Natural Language Query Bar
Ask questions in plain English:
- *"What anomalies were found?"*
- *"Show me the demand forecast"*
- *"What is my current decision bottleneck?"*

Powered by Gemini AI with a graceful rule‑based fallback.

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| **Primary** | `#0066FF` |
| **Background** | `#F8FAFC` (slate‑50) |
| **Surface** | `#FFFFFF` / `#F1F5F9` |
| **Text** | `#1E293B` → `#94A3B8` |
| **Font** | Inter (system‑first) |
| **Radius** | `rounded-xl` (12px) |
| **Shadow** | `shadow-xl shadow-slate-200/50` |

### Animations
- **Beat transitions**: Framer Motion `AnimatePresence` with smooth crossfades
- **Pulsing alerts**: CSS keyframe `pulse‑glow` for anomaly severity
- **Loading states**: Spinning gradient ring + skeleton shimmer
- **Micro‑interactions**: 60fps hover/focus/active states on all interactive elements

---

## 🏗️ Component Architecture

```
src/
├── App.jsx                   # Token gate + beat routing + ErrorBoundary
├── main.jsx                  # Vite entry point
├── index.css                 # Tailwind directives + custom animations
├── components/
│   ├── LoginPage.jsx         # JWT login form
│   ├── Header.jsx            # Nav bar + NLQ query bar
│   ├── ErrorBoundary.jsx     # Class‑based error boundary with retry
│   ├── Beat1_Persona.jsx     # Persona selection cards
│   ├── Beat2_Pipeline.jsx    # Pipeline runner + benchmark charts
│   └── Beat3_DecisionHub.jsx # Alerts, forecasts, LLM recommendations
├── utils/
│   └── retry.js              # fetchWithRetry: AbortController + backoff
└── data/
    └── mockData.js           # Persona definitions, benchmark data
```

### Lazy Loading
```
Main bundle (334 KB)    — App shell, Header, LoginPage
 └── Beat1_Persona (3 KB)     — Loaded on persona selection
 └── Beat2_Pipeline (6 KB)    — Loaded on pipeline run
 └── Beat3_DecisionHub (355 KB) — Loaded on decision view (Recharts)
```

---

## 🛠️ Quick Start

```bash
# Install dependencies
npm install

# Development server (proxies /api → localhost:8080)
npm run dev
# → http://localhost:5173

# Production build
npm run build
# → dist/ ready for Vercel / Render static hosting
```

### Vite Proxy
The dev server automatically proxies `/api/*` requests to the Flask backend:
```js
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_PROXY || 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

---

## 🚢 Deployment

### Vercel (recommended)
```bash
npm i -g vercel
vercel --prod
```

`vercel.json` provides:
- SPA rewrites (`/*` → `/index.html`)
- Immutable asset caching (1 year for `/assets/*`)
- Security headers (HSTS, X‑Frame‑Options, X‑Content‑Type‑Options, X‑XSS‑Protection, Referrer‑Policy)

### Render / Cloud Run
The built `dist/` folder can be served from any static host. No env vars required — all API calls go to the same origin via a reverse proxy.

---

## 🔗 Related

| Repository | Description |
|-----------|-------------|
| [decision-intelligence-platform](https://github.com/your-org/decision-intelligence-platform) | Flask API, GPU pipeline, Gemini integration |

---

<div align="center">

**Part of the Decision Intelligence Platform — Google Cloud + NVIDIA RAPIDS Hackathon**

</div>
