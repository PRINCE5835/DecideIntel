"""
Bad-record filter — schema-adaptive business rule validation.

Detects available columns and applies relevant filter rules:
  - Negative quantities / case counts / transit times
  - Zero / negative prices
  - Future timestamps
  - Unknown status values
"""
from __future__ import annotations

import pandas as pd
from pathlib import Path

from backend.config import NORMALIZED_DIR

VALID_STATUSES = {"pending", "shipped", "delivered", "returned", "cancelled",
                  "on_time", "delayed", "completed",
                  "reported", "investigating", "contained", "resolved", "monitoring",
                  "outbreak"}
MAX_FUTURE_DAYS = 1


def filter_bad_records(df: pd.DataFrame) -> tuple[pd.DataFrame, int, str]:
    before = len(df)
    reasons: list[str] = []
    mask = pd.Series(True, index=df.index)

    for col in ("quantity", "case_count", "transit_minutes"):
        if col in df.columns:
            invalid_neg = df[col] < 0
            if invalid_neg.any():
                reasons.append(f"{col}_neg={invalid_neg.sum()}")
                mask &= ~invalid_neg

    if "unit_price" in df.columns:
        invalid_price = (df["unit_price"] <= 0) | df["unit_price"].isna()
        if invalid_price.any():
            reasons.append(f"invalid_price={invalid_price.sum()}")
            mask &= ~invalid_price

    if "distance_km" in df.columns:
        invalid_dist = df["distance_km"] <= 0
        if invalid_dist.any():
            reasons.append(f"bad_distance={invalid_dist.sum()}")
            mask &= ~invalid_dist
    if "response_hours" in df.columns:
        invalid_resp = df["response_hours"] < 0
        if invalid_resp.any():
            reasons.append(f"neg_response={invalid_resp.sum()}")
            mask &= ~invalid_resp

    if "status" in df.columns:
        invalid_status = ~df["status"].isin(VALID_STATUSES)
        if invalid_status.any():
            reasons.append(f"unknown_status={invalid_status.sum()}")
            mask &= ~invalid_status

    for ts_col in ("timestamp", "departure_ts", "reported_ts"):
        if ts_col in df.columns and pd.api.types.is_datetime64_any_dtype(df[ts_col]):
            future = df[ts_col] > pd.Timestamp.now() + pd.Timedelta(days=MAX_FUTURE_DAYS)
            if future.any():
                reasons.append(f"future_{ts_col}={future.sum()}")
                mask &= ~future

    df = df[mask].reset_index(drop=True)
    dropped = before - len(df)
    return df, dropped, "; ".join(reasons)


def filter_file(path: Path) -> Path:
    df = pd.read_parquet(path)
    df, dropped, reasons = filter_bad_records(df)
    out = path.parent / f"clean_{path.name}"
    df.to_parquet(out, index=False, compression="snappy")
    return out


def filter_all(source_dir: Path = NORMALIZED_DIR) -> list[Path]:
    paths = sorted(source_dir.glob("dedup_normalized_*.parquet"))
    return [filter_file(p) for p in paths] if paths else []


if __name__ == "__main__":
    outputs = filter_all()
    for o in outputs:
        print(f"[Filter] {o.name} written")
