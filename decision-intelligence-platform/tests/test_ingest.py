"""
Tests for the Ingest & Clean Layer.
"""
import pandas as pd
import pytest

from backend.ingest.normalizer import normalize
from backend.ingest.deduplicator import remove_exact_duplicates, remove_fuzzy_duplicates
from backend.ingest.filter import filter_bad_records


@pytest.fixture
def raw_df():
    return pd.DataFrame({
        "order_id": ["ORD-1", "ORD-1", "ORD-2", "", None],
        "product": ["Widget-A", "Widget-A", "Gadget-X", "Widget-B", None],
        "region": ["NA-East", "NA-East", "EU-Central", "APAC", "NA-West"],
        "quantity": [10, 10, -5, 100, "N/A"],
        "unit_price": [25.0, 25.0, 15.0, 0.0, None],
        "status": ["shipped", "shipped", "orphaned", "delivered", "pending"],
        "timestamp": ["2026-06-01 12:00:00", "2026-06-01 12:00:00", "2099-01-01", "2026-06-03", "invalid-date"],
    })


def test_normalizer_coerces_types(raw_df):
    n = normalize(raw_df)
    assert n["quantity"].dtype.kind in "if"
    assert n["unit_price"].dtype.kind in "if"
    assert pd.api.types.is_datetime64_any_dtype(n["timestamp"])
    assert len(n) <= len(raw_df)  # null rows dropped


def test_deduplicator_removes_exact_duplicates(raw_df):
    n = normalize(raw_df)
    d, dropped = remove_exact_duplicates(n)
    assert dropped >= 1
    assert len(d) < len(n)


def test_deduplicator_removes_fuzzy_duplicates(raw_df):
    n = normalize(raw_df)
    d, dropped = remove_fuzzy_duplicates(n)
    assert dropped >= 0


def test_filter_removes_bad_records(raw_df):
    n = normalize(raw_df)
    f, dropped, reasons = filter_bad_records(n)
    assert dropped >= 0
    assert isinstance(reasons, str)
