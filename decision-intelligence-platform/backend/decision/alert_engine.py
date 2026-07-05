"""
Alert engine — generates business alerts based on anomaly scores and thresholds.
"""
from __future__ import annotations

from pathlib import Path
from datetime import datetime

import pandas as pd

from backend.config import DECISIONS_DIR, FEATURES_DIR


def generate_alerts(anomalies_df: pd.DataFrame, threshold: float = 2.0,
                    metric_cols: list[str] | None = None,
                    group_cols: list[str] | None = None) -> pd.DataFrame:
    """Convert anomaly flags into structured business alerts."""
    metric_cols = metric_cols or ["quantity", "unit_price"]
    group_cols = group_cols or ["product", "region"]
    alerts = anomalies_df[anomalies_df["is_anomaly"] == True].copy()

    if alerts.empty:
        return pd.DataFrame(columns=[
            "alert_id", "severity", "topic", "message",
            *group_cols, "timestamp", "recommended_action"
        ])

    alerts["alert_id"] = [f"ALERT-{i:05d}" for i in range(len(alerts))]
    zscores = {c: f"{c}_zscore" for c in metric_cols if f"{c}_zscore" in alerts.columns}

    def highest_z(row):
        return max((abs(row.get(z, 0)), col) for col, z in zscores.items())

    alerts["_max_z"] = alerts.apply(lambda r: highest_z(r)[0], axis=1)
    alerts["_trigger_col"] = alerts.apply(lambda r: highest_z(r)[1], axis=1)
    alerts["severity"] = alerts["_max_z"].apply(
        lambda z: "CRITICAL" if z > 3.5 else "WARNING"
    )
    alerts["topic"] = alerts["_trigger_col"].map({
        "quantity": "Volume Spike", "unit_price": "Price Spike",
        "transit_minutes": "Delay Spike", "distance_km": "Route Deviation",
        "case_count": "Case Surge", "response_hours": "Response Lag",
    }).fillna("Anomaly Detected")

    grp_parts = alerts.apply(
        lambda r: ", ".join(str(r.get(c, "?")) for c in group_cols), axis=1
    )
    alerts["message"] = alerts.apply(
        lambda r: f"{r['topic']}: {grp_parts.loc[r.name]} "
        f"({r['_trigger_col']} z={r['_max_z']:.1f})",
        axis=1
    )
    alerts["recommended_action"] = alerts["topic"].map({
        "Volume Spike": "Check inventory — unusual volume detected",
        "Price Spike": "Review pricing — possible data error or market shift",
        "Delay Spike": "Investigate route — check for congestion or incidents",
        "Route Deviation": "Verify driver log and GPS trace",
        "Case Surge": "Deploy rapid response team to affected region",
        "Response Lag": "Audit emergency resource allocation",
    }).fillna("Flag for review")

    for c in group_cols:
        if c not in alerts.columns:
            alerts[c] = ""
    alerts["timestamp"] = datetime.now().isoformat()

    cols = ["alert_id", "severity", "topic", "message", *group_cols, "timestamp", "recommended_action"]
    return alerts[[c for c in cols if c in alerts.columns]]


def run_alerts(metric_cols: list[str] | None = None,
               group_cols: list[str] | None = None,
               threshold: float | None = None) -> Path:
    path = FEATURES_DIR / "anomalies.parquet"
    if not path.exists():
        from backend.analyze.anomaly_detection import run_anomaly_detection
        path = run_anomaly_detection(metric_cols=metric_cols, z_threshold=threshold)

    df = pd.read_parquet(path)
    alerts = generate_alerts(df, threshold or 2.0, metric_cols, group_cols)

    out = DECISIONS_DIR / "alerts.parquet"
    alerts.to_parquet(out, index=False, compression="snappy")
    return out


if __name__ == "__main__":
    p = run_alerts()
    print(f"[AlertEngine] {p.name} written")
