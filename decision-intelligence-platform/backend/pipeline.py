"""
End-to-end pipeline — runs configurable per-persona with persona-specific
seeding, column mappings, and thresholds.
"""
from __future__ import annotations

import time
from dataclasses import asdict
from pathlib import Path
from typing import Any

import pandas as pd

from backend.config import RAW_DIR, NORMALIZED_DIR, FEATURES_DIR, DECISIONS_DIR
from backend.persona_config import PERSONA_MAP
from backend.ingest.normalizer import normalize_all
from backend.ingest.deduplicator import deduplicate_all
from backend.ingest.filter import filter_all
from backend.analyze.feature_agg import aggregate_all
from backend.analyze.trend_join import run_trend_analysis
from backend.analyze.anomaly_detection import run_anomaly_detection
from backend.analyze.benchmark import run_all_benchmarks
from backend.decision.alert_engine import run_alerts
from backend.decision.forecast import run_forecast
from backend.decision.llm_recommend import run_recommendation


def run_pipeline(seed: bool = True, persona_id: str = "supply_chain",
                 num_files: int = 5, rows_per_file: int = 2000) -> dict[str, Any]:
    """Execute the full pipeline for a given persona."""
    cfg = PERSONA_MAP.get(persona_id, PERSONA_MAP["supply_chain"])
    t0 = time.time()

    # ── 0. Clear stale data from previous runs ──────────────────
    import shutil
    for d in [RAW_DIR, NORMALIZED_DIR, FEATURES_DIR, DECISIONS_DIR]:
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True, exist_ok=True)
    # recreate subdirs needed by multi_source
    for sub in ["json_logs", "text_reports"]:
        (RAW_DIR / sub).mkdir(parents=True, exist_ok=True)

    # ── 1. Seed persona-specific data ───────────────────────────
    if seed:
        from backend.ingest.multi_source import seed_all_sources
        seed_all_sources(
            persona_id=persona_id,
            num_csv_files=num_files,
            csv_rows=rows_per_file,
        )

    # ── 2. Normalize / Deduplicate / Filter ─────────────────────
    normalize_all(RAW_DIR)
    deduplicate_all()
    filter_all()

    # ── 3. Load cleaned data ────────────────────────────────────
    paths = sorted(NORMALIZED_DIR.glob("clean_dedup_normalized_*.parquet"))
    dfs = [pd.read_parquet(p) for p in paths]
    combined = pd.concat(dfs, ignore_index=True) if dfs else pd.DataFrame()

    # ── 4. Benchmarks ───────────────────────────────────────────
    bench_results = []
    if not combined.empty:
        bench_results = run_all_benchmarks(combined)

    # ── 5. Feature Aggregation ──────────────────────────────────
    aggregate_all(
        metric_cols=cfg.metric_columns,
        group_cols=cfg.group_columns,
        id_col=cfg.id_column,
    )

    # ── 6. Trend Analysis ───────────────────────────────────────
    run_trend_analysis(
        group_cols=cfg.group_columns,
        metric_col=cfg.metric_columns[0],
        id_col=cfg.id_column,
        ts_col=cfg.timestamp_column,
    )

    # ── 7. Anomaly Detection ────────────────────────────────────
    run_anomaly_detection(
        metric_cols=cfg.metric_columns,
        z_threshold=cfg.anomaly_z_threshold,
    )

    # ── 8. Alerts ───────────────────────────────────────────────
    run_alerts(
        metric_cols=cfg.metric_columns,
        group_cols=cfg.group_columns,
        threshold=cfg.alert_critical_z,
    )

    # ── 9. Forecast ─────────────────────────────────────────────
    run_forecast(
        metric_cols=cfg.metric_columns,
        group_cols=cfg.group_columns,
    )

    # ── 10. LLM Recommendation ──────────────────────────────────
    recommendation = run_recommendation()

    total_time = round(time.time() - t0, 2)

    alerts_path = DECISIONS_DIR / "alerts.parquet"
    forecasts_path = DECISIONS_DIR / "forecasts.parquet"
    anomalies_path = FEATURES_DIR / "anomalies.parquet"

    alert_count = len(pd.read_parquet(alerts_path)) if alerts_path.exists() else 0
    forecast_count = len(pd.read_parquet(forecasts_path)) if forecasts_path.exists() else 0
    anomaly_count = 0
    if anomalies_path.exists():
        adf = pd.read_parquet(anomalies_path)
        anomaly_count = int(adf["is_anomaly"].sum()) if "is_anomaly" in adf else 0

    return {
        "user": f"{cfg.name} — {cfg.role}",
        "persona_id": persona_id,
        "decision_bottleneck": cfg.bottleneck,
        "ingest_files": num_files,
        "cleaned_records": len(combined),
        "anomaly_count": anomaly_count,
        "alert_count": alert_count,
        "forecast_count": forecast_count,
        "recommendation": recommendation.get("recommendation", ""),
        "recommendation_source": recommendation.get("source", "unknown"),
        "benchmarks": [asdict(b) for b in bench_results],
        "total_seconds": total_time,
    }


if __name__ == "__main__":
    import json
    for pid in ("supply_chain", "transportation", "health"):
        print(f"\n{'='*60}")
        print(f"  Running pipeline for: {pid}")
        print(f"{'='*60}")
        result = run_pipeline(seed=True, persona_id=pid, num_files=2, rows_per_file=500)
        print(json.dumps({k: v for k, v in result.items() if k != "recommendation"}, indent=2))
