# Decision Intelligence UI

React + Vite frontend for the Decision Intelligence Platform — a multi-persona decision analytics dashboard with GPU-accelerated pipeline visualisation, anomaly alerts, demand forecasts, and LLM-powered natural language querying.

## Tech Stack
- **React 19** with hooks, lazy loading, and Suspense
- **Vite 8** for fast HMR and production builds
- **Tailwind CSS 4** with utility-first styling
- **Framer Motion** for beat transitions and micro-interactions
- **Recharts** for benchmark comparison charts
- **Lucide React** for iconography
- **Inter font** for typography

## Key Components
| Component | Purpose |
|-----------|---------|
| `LoginPage.jsx` | JWT-based login with bcrypt-authenticated credentials |
| `Header.jsx` | Navigation bar + NLQ query bar with Gemini integration |
| `Beat1_Persona.jsx` | Persona selection (Supply Chain / Transportation / Health) |
| `Beat2_Pipeline.jsx` | Pipeline execution + CPU vs GPU benchmark comparison |
| `Beat3_DecisionHub.jsx` | Anomaly alerts, demand forecasts, LLM recommendations |
| `ErrorBoundary.jsx` | Class-based error boundary with retry UI |

## Pages / Routing
SPA with three views gated by JWT token (stored in `localStorage`):
1. **Identity & Data** — select a persona
2. **Pipeline Build** — run pipeline, view benchmarks
3. **Decision Output** — alerts, forecasts, recommendations

## Quick Start
```bash
npm install
npm run dev     # dev server at localhost:5173 (proxies /api to backend)
npm run build   # production build to dist/
```

## Deploy
```bash
vercel --prod
```
`vercel.json` handles SPA rewrites, security headers, and immutable asset caching.

## Environment
No env vars required for the frontend — API calls are proxied through Vite's dev server or served from the same origin in production via Render/Vercel.
