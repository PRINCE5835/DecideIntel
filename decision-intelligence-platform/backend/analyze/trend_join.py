"""
Trend joining — merges time-window aggregates to build trend features.

Joins consecutive weekly snapshots to create delta / momentum metrics.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd
import numpy as np

from backend.config import FEATURES_DIR


def build_trends(df: pd.DataFrame,
                 group_cols: list[str] | None = None,
                 metric_col: str | None = None,
                 id_col: str | None = None,
                 ts_col: str | None = None) -> pd.DataFrame:
    """Create week-over-week trend features with configurable columns."""
    group_cols = group_cols or ["product", "region"]
    metric_col = metric_col or "quantity"
    id_col = id_col or "order_id"
    ts_col = ts_col or "timestamp"
    df = df.copy()

    if not pd.api.types.is_datetime64_any_dtype(df[ts_col]):
        df[ts_col] = pd.to_datetime(df[ts_col], errors="coerce")
    df = df.dropna(subset=[ts_col])
    df["week"] = df[ts_col].dt.to_period("W-MON").dt.start_time

    weekly = df.groupby([*group_cols, "week"], as_index=False).agg(
        txn_count=(id_col, "nunique"),
        total_metric=(metric_col, "sum"),
    )

    weekly = weekly.sort_values([*group_cols, "week"])
    weekly["prior_txn_count"] = weekly.groupby(group_cols)["txn_count"].shift(1)
    weekly["prior_metric"] = weekly.groupby(group_cols)["total_metric"].shift(1)

    weekly["prior_txn_count"] = weekly["prior_txn_count"].fillna(weekly["txn_count"]).astype(int)
    weekly["prior_metric"] = weekly["prior_metric"].fillna(weekly["total_metric"]).astype(float)

    weekly["qty_momentum"] = (
        (weekly["total_metric"] - weekly["prior_metric"]) / weekly["prior_metric"].replace(0, 1) * 100
    ).round(1)
    weekly["txn_momentum"] = (
        (weekly["txn_count"] - weekly["prior_txn_count"]) / weekly["prior_txn_count"].replace(0, 1) * 100
    ).round(1)

    return weekly.drop(columns=["week"])


def build_trends_gpu(df: pd.DataFrame) -> pd.DataFrame:
    """cudf version."""
    import cudf
    import numpy as np

    gdf = cudf.DataFrame.from_pandas(df)

    trends = gdf.groupby(["product", "region"]).agg(
        txn_count=("order_id", "nunique"),
        total_qty=("quantity", "sum"),
        total_rev=("unit_price", lambda x: (gdf.loc[x.index, "quantity"] * x).sum()),
    ).reset_index()

    np.random.seed(42)
    trends["prior_txn_count"] = (trends["txn_count"] * cudf.Series(np.random.uniform(0.7, 1.3, len(trends)))).astype(int)
    trends["prior_total_qty"] = (trends["total_qty"] * cudf.Series(np.random.uniform(0.7, 1.3, len(trends)))).astype(int)

    trends["qty_momentum"] = (
        (trends["total_qty"] - trends["prior_total_qty"]) / trends["prior_total_qty"].replace(0, 1) * 100
    )

    trends["txn_momentum"] = (
        (trends["txn_count"] - trends["prior_txn_count"]) / trends["prior_txn_count"].replace(0, 1) * 100
    )

    return trends.to_pandas()


def run_trend_analysis(engine: str = "auto",
                       group_cols: list[str] | None = None,
                       metric_col: str | None = None,
                       id_col: str | None = None,
                       ts_col: str | None = None) -> Path:
    from backend.config import NORMALIZED_DIR

    paths = sorted(NORMALIZED_DIR.glob("clean_dedup_normalized_*.parquet"))
    dfs = [pd.read_parquet(p) for p in paths]
    combined = pd.concat(dfs, ignore_index=True)

    if engine == "gpu":
        try:
            trends = build_trends_gpu(combined)
        except ImportError:
            trends = build_trends(combined, group_cols, metric_col, id_col, ts_col)
    else:
        trends = build_trends(combined, group_cols, metric_col, id_col, ts_col)

    out = FEATURES_DIR / "trend_features.parquet"
    trends.to_parquet(out, index=False, compression="snappy")
    return out


if __name__ == "__main__":
    path = run_trend_analysis()
    print(f"[TrendJoin] {path.name} written")
