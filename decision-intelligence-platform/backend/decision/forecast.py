"""
Forecast engine — generates simple time-series forecasts for decision support.

Uses exponential smoothing as a lightweight, explainable method.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd
import numpy as np

from backend.config import DECISIONS_DIR, FEATURES_DIR


def forecast_next_period(agg_df: pd.DataFrame, alpha: float = 0.3,
                         metric_cols: list[str] | None = None,
                         group_cols: list[str] | None = None) -> pd.DataFrame:
    """Simple exponential-smoothing forecast with configurable columns."""
    metric_cols = metric_cols or ["quantity", "unit_price"]
    group_cols = group_cols or ["product", "region"]
    sum_col = f"sum_{metric_cols[0]}"
    med_col = f"median_{metric_cols[0]}" if f"median_{metric_cols[0]}" in agg_df.columns else sum_col

    records = []
    for _, row in agg_df.iterrows():
        current = row.get(sum_col, 0) or 0
        prior = row.get(med_col, current) or current
        forecast_val = alpha * float(current) + (1 - alpha) * float(prior)
        lower = forecast_val * 0.8
        upper = forecast_val * 1.2

        rec = {"current_demand": int(current)}
        for c in group_cols:
            rec[c] = row.get(c, "")
        rec["forecast_demand"] = round(forecast_val, 1)
        rec["forecast_lower"] = round(lower, 1)
        rec["forecast_upper"] = round(upper, 1)
        rec["confidence"] = "HIGH" if alpha > 0.2 else "MEDIUM"
        rec["method"] = "exponential_smoothing"
        records.append(rec)

    return pd.DataFrame(records)


def run_forecast(metric_cols: list[str] | None = None,
                 group_cols: list[str] | None = None) -> Path:
    feat_paths = sorted(FEATURES_DIR.glob("features_*.parquet"))
    if not feat_paths:
        raise FileNotFoundError("No feature files found. Run feature_agg first.")

    df = pd.read_parquet(feat_paths[0])
    forecast = forecast_next_period(df, metric_cols=metric_cols, group_cols=group_cols)

    out = DECISIONS_DIR / "forecasts.parquet"
    forecast.to_parquet(out, index=False, compression="snappy")
    return out


if __name__ == "__main__":
    p = run_forecast()
    print(f"[Forecast] {p.name} written")
