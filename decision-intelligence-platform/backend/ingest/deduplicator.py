"""
Duplicate remover — schema-adaptive deduplication for multi-persona data.

Detects available columns and deduplicates based on what's present.
"""
from __future__ import annotations

import pandas as pd
from pathlib import Path

from backend.config import NORMALIZED_DIR

ALL_KEY_COLS = {"order_id", "product", "region", "quantity", "unit_price", "timestamp",
                "trip_id", "route_id", "transit_minutes", "distance_km", "departure_ts",
                "case_id", "facility_type", "case_count", "response_hours", "reported_ts"}


def remove_exact_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    before = len(df)
    key_cols = [c for c in ALL_KEY_COLS if c in df.columns]
    if key_cols:
        df = df.drop_duplicates(subset=key_cols, keep="first")
    dropped = before - len(df)
    return df, dropped


def remove_fuzzy_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Drop rows sharing the same ID column beyond the first occurrence."""
    for id_col in ("order_id", "trip_id", "case_id"):
        if id_col in df.columns:
            before = len(df)
            df = df.drop_duplicates(subset=[id_col], keep="first")
            dropped = before - len(df)
            return df, dropped
    return df, 0


def deduplicate_file(path: Path) -> Path:
    df = pd.read_parquet(path)
    df, _ = remove_exact_duplicates(df)
    df, _ = remove_fuzzy_duplicates(df)
    out = path.parent / f"dedup_{path.name}"
    df.to_parquet(out, index=False, compression="snappy")
    return out


def deduplicate_all(source_dir: Path = NORMALIZED_DIR) -> list[Path]:
    paths = sorted(source_dir.glob("normalized_*.parquet"))
    return [deduplicate_file(p) for p in paths] if paths else []


if __name__ == "__main__":
    outputs = deduplicate_all()
    for o in outputs:
        print(f"[Deduplicator] {o.name} written")
