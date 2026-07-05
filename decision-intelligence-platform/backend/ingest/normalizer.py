"""
Data normalizer — adaptively standardises schema, types, and date formats
based on the columns present in each file.

Supports all three persona schemas:
  - Supply Chain: quantity, unit_price, order_id, product, region, timestamp
  - Transportation: transit_minutes, distance_km, trip_id, route_id, departure_ts
  - Health: case_count, response_hours, case_id, facility_type, reported_ts
"""
from __future__ import annotations

import pandas as pd
from pathlib import Path

from backend.config import NORMALIZED_DIR

NUMERIC_COLS = {"quantity", "unit_price", "transit_minutes", "distance_km", "case_count", "response_hours"}
ID_COLS = {"order_id", "trip_id", "case_id"}
GROUP_COLS = {"product", "region", "route_id", "facility_type", "region"}
TS_COLS = {"timestamp", "departure_ts", "reported_ts"}
STATUS_COLS = {"status"}


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Apply column-level normalisation rules based on detected schema."""
    df = df.copy()

    # Cast detected numeric columns
    num_present = [c for c in NUMERIC_COLS if c in df.columns]
    for col in num_present:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Parse detected timestamp columns
    ts_present = [c for c in TS_COLS if c in df.columns]
    for col in ts_present:
        df[col] = pd.to_datetime(df[col], errors="coerce")

    # String cleaning on detected ID/group columns
    str_cols = [c for c in ID_COLS | GROUP_COLS | STATUS_COLS if c in df.columns]
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip()
        if col in ID_COLS:
            df[col] = df[col].str.upper()

    # Drop rows where critical identifiers are missing
    id_present = [c for c in ID_COLS if c in df.columns]
    if id_present:
        df = df.dropna(subset=id_present)

    return df


def normalize_file(path: Path) -> Path:
    df = pd.read_csv(path)
    df = normalize(df)
    out = NORMALIZED_DIR / f"normalized_{path.stem}.parquet"
    df.to_parquet(out, index=False, compression="snappy")
    return out


def normalize_all(source_dir: Path) -> list[Path]:
    paths = sorted(source_dir.glob("*.csv"))
    return [normalize_file(p) for p in paths]


if __name__ == "__main__":
    from backend.config import RAW_DIR
    outputs = normalize_all(RAW_DIR)
    for o in outputs:
        print(f"[Normalizer] {o.name} written")
