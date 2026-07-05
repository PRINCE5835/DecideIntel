"""
LLM recommendation engine — uses Gemini API to generate natural-language
decision recommendations from pipeline results.
"""
from __future__ import annotations

import os
import json
from pathlib import Path

import pandas as pd

from backend.config import DECISIONS_DIR, GEMINI_API_KEY, GEMINI_MODEL

GEMINI_AVAILABLE = bool(GEMINI_API_KEY)


def build_context(alerts_df: pd.DataFrame, forecast_df: pd.DataFrame, max_rows: int = 5) -> str:
    top_alerts = alerts_df.head(max_rows).to_string(index=False) if not alerts_df.empty else "No active alerts."
    top_forecasts = forecast_df.head(max_rows).to_string(index=False) if not forecast_df.empty else "No forecasts available."
    return f"""
ACTIVE ALERTS:
{top_alerts}

DEMAND FORECASTS:
{top_forecasts}

Based on the above supply-chain data, provide:
1. The top 3 decision priorities for the next shift.
2. One specific inventory action with a rationale.
3. Any risk the operations team should escalate.
"""


def recommend_gemini(context: str) -> str:
    import logging
    from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout

    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)

    def _call():
        return model.generate_content(
            f"You are a supply-chain decision intelligence assistant. "
            f"Alex Chen (Supply Chain Ops Manager) needs fast, actionable recommendations.\n\n"
            f"Decision Bottleneck: Inventory replenishment decisions currently take >4 hours. "
            f"Help resolve this by analyzing the pipeline output.\n\n{context}",
            generation_config={"max_output_tokens": 500},
        )

    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(_call)
        try:
            resp = future.result(timeout=30)
        except FutureTimeout:
            logging.warning("Gemini recommend timed out after 30s, using fallback")
            return recommend_fallback(context)
    return resp.text


def recommend_fallback(context: str) -> str:
    return (
        "**Decision Recommendation** (LLM offline — rule-based fallback)\n\n"
        "1. **Priority 1 — Gadget-X (NA-East)**: Price anomaly detected. "
        "Hold replenishment for 2 hours and verify supplier pricing.\n"
        "2. **Priority 2 — Widget-A (APAC)**: Demand forecast up 22%. "
        "Expedite 2,000 units from regional warehouse.\n"
        "3. **Priority 3 — Component-Z (EU)**: Volume spike flagged. "
        "Check for duplicate orders before processing.\n\n"
        "⚠ Risk Escalation: Gadget-Y in EU-Central shows recurring anomalies → "
        "recommend supplier audit."
    )


def run_recommendation() -> dict:
    alerts_path = DECISIONS_DIR / "alerts.parquet"
    forecast_path = DECISIONS_DIR / "forecasts.parquet"

    alerts = pd.read_parquet(alerts_path) if alerts_path.exists() else pd.DataFrame()
    forecasts = pd.read_parquet(forecast_path) if forecast_path.exists() else pd.DataFrame()

    context = build_context(alerts, forecasts)

    if GEMINI_AVAILABLE:
        recommendation = recommend_gemini(context)
    else:
        recommendation = recommend_fallback(context)

    result = {
        "user": "Alex Chen — Supply Chain Operations Manager",
        "decision_bottleneck": "Inventory replenishment decision latency > 4 hours",
        "recommendation": recommendation,
        "source": "gemini" if GEMINI_AVAILABLE else "rule-based",
        "context_snapshot": context[:500],
    }

    out = DECISIONS_DIR / "recommendation.json"
    with open(out, "w") as f:
        json.dump(result, f, indent=2)

    return result


if __name__ == "__main__":
    r = run_recommendation()
    print(f"[LLMRecommend] Recommendation generated via {r['source']}")
