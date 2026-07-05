"""
Anomaly detection — identifies outlier transactions using statistical methods.

Uses cudf for GPU acceleration when available.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd
import numpy as np

from backend.config import FEATURES_DIR

try:
    import cudf

    CUDF_AVAILABLE = True
except ImportError:
    CUDF_AVAILABLE = False


def detect_anomalies(df: pd.DataFrame, z_threshold: float = 2.0,
                     metric_cols: list[str] | None = None) -> pd.DataFrame:
    """Flag anomalies based on z-score of specified metric columns."""
    metric_cols = metric_cols or ["quantity", "unit_price"]
    df = df.copy()

    for col in metric_cols:
        if col not in df.columns:
            continue
        mean = df[col].mean()
        std = df[col].std()
        df[f"{col}_zscore"] = (df[col] - mean) / std if std > 0 else 0.0

    anomaly_cols = [f"{c}_zscore" for c in metric_cols if f"{c}_zscore" in df.columns]
    if anomaly_cols:
        df["is_anomaly"] = df[anomaly_cols].abs().gt(z_threshold).any(axis=1)
    else:
        df["is_anomaly"] = False

    return df


def detect_anomalies_gpu(df: pd.DataFrame, z_threshold: float = 2.0) -> pd.DataFrame:
    """cudf version."""
    import cudf

    gdf = cudf.DataFrame.from_pandas(df)

    for col in ["quantity", "unit_price"]:
        mean = gdf[col].mean()
        std = gdf[col].std()
        gdf[f"{col}_zscore"] = (gdf[col] - mean) / std if std > 0 else 0.0

    gdf["is_anomaly"] = (
        (gdf["quantity_zscore"].abs() > z_threshold)
        | (gdf["unit_price_zscore"].abs() > z_threshold)
    )

    return gdf.to_pandas()


def run_anomaly_detection(engine: str = "auto",
                          metric_cols: list[str] | None = None,
                          z_threshold: float | None = None) -> Path:
    from backend.config import NORMALIZED_DIR

    paths = sorted(NORMALIZED_DIR.glob("clean_dedup_normalized_*.parquet"))
    if not paths:
        raise FileNotFoundError("No cleaned data found. Run the ingest pipeline first.")
    dfs = [pd.read_parquet(p) for p in paths]
    combined = pd.concat(dfs, ignore_index=True)

    z_threshold = z_threshold or 2.0
    if engine == "gpu" and CUDF_AVAILABLE:
        result = detect_anomalies_gpu(combined, z_threshold)
    else:
        result = detect_anomalies(combined, z_threshold, metric_cols)

    out = FEATURES_DIR / "anomalies.parquet"
    result.to_parquet(out, index=False, compression="snappy")
    return out


if __name__ == "__main__":
    path = run_anomaly_detection()
    print(f"[AnomalyDetection] {path.name} written — anomalies flagged")
