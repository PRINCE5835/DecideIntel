"""
Feature aggregations — groups and rolls up cleaned data.

Accepts persona-specific column names for multi-domain support.
Uses cudf when available; falls back to pandas automatically.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from backend.config import FEATURES_DIR

try:
    import cudf
    CUDF_AVAILABLE = True
except ImportError:
    CUDF_AVAILABLE = False


def compute_aggregations(df: pd.DataFrame,
                         metric_cols: list[str] | None = None,
                         group_cols: list[str] | None = None,
                         id_col: str | None = None) -> pd.DataFrame:
    """Compute per-group feature aggregates."""
    metric_cols = metric_cols or ["quantity", "unit_price"]
    group_cols = group_cols or ["product", "region"]
    id_col = id_col or "order_id"

    is_supply_chain = set(metric_cols) == {"quantity", "unit_price"}
    agg_map = {}
    for col in metric_cols:
        if is_supply_chain:
            name_map = {"quantity": "total_quantity", "unit_price": "avg_unit_price"}
            agg_map[name_map.get(col, f"sum_{col}")] = (col, "sum")
            if col in ("quantity",):
                agg_map["median_quantity"] = (col, "median")
        else:
            agg_map[f"sum_{col}"] = (col, "sum")
            agg_map[f"avg_{col}"] = (col, "mean")
            if col in ("quantity", "case_count", "transit_minutes"):
                agg_map[f"median_{col}"] = (col, "median")

    agg_map["order_count" if is_supply_chain else f"{id_col}_count"] = (id_col, "nunique")

    use_revenue = "quantity" in metric_cols and "unit_price" in metric_cols
    if use_revenue:
        revenue = df["quantity"] * df["unit_price"]
        df = df.assign(revenue=revenue)
        agg_map["total_revenue"] = ("revenue", "sum")

    grouped = df.groupby(group_cols, as_index=False).agg(**agg_map)

    if use_revenue and "order_count" in grouped:
        grouped["revenue_per_order"] = (
            grouped["total_revenue"] / grouped["order_count"].replace(0, 1)
        ).round(2)

    return grouped.round(2)


def compute_aggregations_gpu(df: pd.DataFrame) -> pd.DataFrame:
    import cudf
    gdf = cudf.DataFrame.from_pandas(df)
    grouped = gdf.groupby(["product", "region"], as_index=False).agg(
        total_quantity=("quantity", "sum"),
        avg_unit_price=("unit_price", "mean"),
        median_quantity=("quantity", "median"),
        order_count=("order_id", "nunique"),
        total_revenue=("unit_price", lambda x: (gdf.loc[x.index, "quantity"] * x).sum()),
    )
    result = grouped.to_pandas()
    result["revenue_per_order"] = (
        result["total_revenue"] / result["order_count"].replace(0, 1)
    )
    return result.round(2)


def aggregate_file(path: Path, engine: str = "auto",
                   metric_cols: list[str] | None = None,
                   group_cols: list[str] | None = None,
                   id_col: str | None = None) -> Path:
    df = pd.read_parquet(path)
    if engine == "gpu" and CUDF_AVAILABLE:
        agg = compute_aggregations_gpu(df)
    else:
        agg = compute_aggregations(df, metric_cols, group_cols, id_col)
    out = FEATURES_DIR / f"features_{path.name}"
    agg.to_parquet(out, index=False, compression="snappy")
    return out


def aggregate_all(source_glob: str = "clean_dedup_normalized_*.parquet",
                  engine: str = "auto",
                  metric_cols: list[str] | None = None,
                  group_cols: list[str] | None = None,
                  id_col: str | None = None) -> list[Path]:
    from backend.config import NORMALIZED_DIR
    paths = sorted(NORMALIZED_DIR.glob(source_glob))
    return [aggregate_file(p, engine, metric_cols, group_cols, id_col) for p in paths]


if __name__ == "__main__":
    outputs = aggregate_all()
    for o in outputs:
        print(f"[FeatureAgg] {o.name} written")
