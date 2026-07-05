"""
Tests for the Decision Layer.
"""
import pandas as pd
import pytest

from backend.decision.alert_engine import generate_alerts
from backend.decision.forecast import forecast_next_period


@pytest.fixture
def anomalies_df():
    return pd.DataFrame({
        "order_id": ["ORD-1", "ORD-2"],
        "product": ["Widget-A", "Gadget-X"],
        "region": ["NA-East", "EU-Central"],
        "quantity": [500, 2],
        "quantity_zscore": [4.5, 0.3],
        "unit_price": [250.0, 5.0],
        "unit_price_zscore": [0.1, 3.2],
        "is_anomaly": [True, True],
        "timestamp": ["2026-06-01", "2026-06-01"],
    })


@pytest.fixture
def agg_df():
    return pd.DataFrame({
        "product": ["Widget-A", "Gadget-X"],
        "region": ["NA-East", "EU-Central"],
        "total_quantity": [5000, 1200],
        "median_quantity": [4800, 1100],
    })


def test_alerts_generated_for_anomalies(anomalies_df):
    alerts = generate_alerts(anomalies_df, threshold=2.0)
    assert len(alerts) == 2
    assert "alert_id" in alerts.columns
    assert "severity" in alerts.columns
    assert "message" in alerts.columns


def test_alerts_empty_when_no_anomalies():
    clean = pd.DataFrame(columns=["order_id", "is_anomaly", "product", "region"])
    alerts = generate_alerts(clean)
    assert len(alerts) == 0


def test_forecast_produces_range(agg_df):
    fc = forecast_next_period(agg_df, alpha=0.3)
    assert len(fc) == 2
    assert "forecast_demand" in fc.columns
    assert "forecast_lower" in fc.columns
    assert "forecast_upper" in fc.columns
    assert all(fc["forecast_lower"] < fc["forecast_demand"])
    assert all(fc["forecast_upper"] > fc["forecast_demand"])
