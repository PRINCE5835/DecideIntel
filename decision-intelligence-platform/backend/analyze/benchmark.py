"""
Benchmark utility — measures CPU (pandas) vs GPU (cudf) execution time.

Returns structured metrics the dashboard can render as acceleration metres.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, asdict
from typing import Callable

import pandas as pd
import numpy as np

CUDF_AVAILABLE = False
try:
    import cudf

    CUDF_AVAILABLE = True
except ImportError:
    pass


@dataclass
class BenchmarkResult:
    operation: str
    cpu_seconds: float
    gpu_seconds: float | None
    rows_processed: int
    speedup: float | None

    @property
    def gpu_available(self) -> bool:
        return self.gpu_seconds is not None

    def to_dict(self) -> dict:
        return asdict(self)


def _time_it(fn: Callable, *args, **kwargs) -> float:
    start = time.perf_counter()
    fn(*args, **kwargs)
    return time.perf_counter() - start


def run_benchmark(
    operation_name: str,
    pandas_fn: Callable[[], pd.DataFrame],
    cudf_fn: Callable | None = None,
    rows: int = 0,
) -> BenchmarkResult:
    cpu_t = _time_it(pandas_fn)
    gpu_t = None
    if CUDF_AVAILABLE and cudf_fn is not None:
        gpu_t = _time_it(cudf_fn)

    speedup = (cpu_t / gpu_t) if (gpu_t and gpu_t > 0) else None
    return BenchmarkResult(
        operation=operation_name,
        cpu_seconds=round(cpu_t, 4),
        gpu_seconds=round(gpu_t, 4) if gpu_t else None,
        rows_processed=rows,
        speedup=round(speedup, 2) if speedup else None,
    )


def benchmark_feature_agg(df: pd.DataFrame) -> BenchmarkResult:
    rows = len(df)

    def pandas_agg():
        return df.groupby(["product", "region"]).agg(
            total_qty=("quantity", "sum"),
            avg_price=("unit_price", "mean"),
            order_count=("order_id", "nunique"),
        ).reset_index()

    def cudf_agg():
        import cudf

        gdf = cudf.DataFrame.from_pandas(df)
        return gdf.groupby(["product", "region"]).agg(
            total_qty=("quantity", "sum"),
            avg_price=("unit_price", "mean"),
            order_count=("order_id", "nunique"),
        ).reset_index().to_pandas()

    return run_benchmark(
        "Feature Aggregation (groupby product+region)",
        pandas_agg,
        cudf_agg if CUDF_AVAILABLE else None,
        rows,
    )


def benchmark_trend_join(df1: pd.DataFrame, df2: pd.DataFrame) -> BenchmarkResult:
    rows = len(df1) + len(df2)

    def pandas_join():
        return pd.merge(df1, df2, on="order_id", how="left", suffixes=("_a", "_b"))

    def cudf_join():
        import cudf

        g1 = cudf.DataFrame.from_pandas(df1)
        g2 = cudf.DataFrame.from_pandas(df2)
        return g1.merge(g2, on="order_id", how="left", suffixes=("_a", "_b")).to_pandas()

    return run_benchmark("Trend Join (merge on order_id)", pandas_join, cudf_join if CUDF_AVAILABLE else None, rows)


def run_all_benchmarks(df: pd.DataFrame) -> list[BenchmarkResult]:
    results = []
    if {"product", "region", "quantity", "unit_price", "order_id"}.issubset(df.columns):
        results.append(benchmark_feature_agg(df))
        results.append(benchmark_trend_join(df.head(len(df) // 2), df.tail(len(df) // 2)))
    else:
        # Non-supply-chain schema — run a generic sort benchmark instead
        rows = len(df)
        col = df.select_dtypes(include="number").columns[0] if any(df.select_dtypes(include="number").columns) else df.columns[0]

        def pandas_sort():
            return df.sort_values(col)

        results.append(run_benchmark(f"Sort ({col})", pandas_sort, None, rows))
    return results
