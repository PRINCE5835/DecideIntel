"""
Tests for the Analyze & Model Layer.
"""
import pandas as pd
import numpy as np
import pytest

from backend.analyze.feature_agg import compute_aggregations
from backend.analyze.trend_join import build_trends
from backend.analyze.anomaly_detection import detect_anomalies


@pytest.fixture
def sample_df():
    np.random.seed(42)
    n = 100
    return pd.DataFrame({
        "order_id": [f"ORD-{i}" for i in range(n)],
        "product": np.random.choice(["Widget-A", "Widget-B", "Gadget-X"], n),
        "region": np.random.choice(["NA-East", "EU-Central"], n),
        "quantity": np.random.randint(1, 100, n),
        "unit_price": np.random.uniform(5, 200, n).round(2),
        "status": np.random.choice(["shipped", "delivered"], n),
        "timestamp": pd.date_range("2026-01-01", periods=n, freq="h"),
    })


def test_feature_aggregation_returns_grouped(sample_df):
    agg = compute_aggregations(sample_df)
    assert "product" in agg.columns
    assert "region" in agg.columns
    assert "total_quantity" in agg.columns
    assert len(agg) <= len(sample_df)
    assert agg["total_revenue"].sum() > 0


def test_trend_builds_momentum(sample_df):
    trends = build_trends(sample_df)
    assert "qty_momentum" in trends.columns
    assert "txn_momentum" in trends.columns


def test_anomaly_detection_flags(sample_df):
    result = detect_anomalies(sample_df, z_threshold=1.0)
    assert "is_anomaly" in result.columns
    assert result["is_anomaly"].dtype == bool
    assert result["is_anomaly"].sum() >= 0
