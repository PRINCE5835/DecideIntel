"""
Mock landing zone — simulates Cloud Storage / BigQuery table ingestion.

Generates realistic supply-chain transaction CSVs with intentional
duplicates and bad records so the pipeline can demonstrate cleaning.
"""
import csv
import random
import string
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np

from backend.config import RAW_DIR

REAL_USER = "Alex Chen — Supply Chain Operations Manager"
DECISION_BOTTLENECK = "Inventory replenishment decision latency > 4 hours"

PRODUCTS = ["Widget-A", "Widget-B", "Gadget-X", "Gadget-Y", "Component-Z"]
REGIONS = ["NA-East", "NA-West", "EU-Central", "APAC-Southeast"]
STATUSES = ["pending", "shipped", "delivered", "returned", "cancelled"]


def _random_ts(days_back: int = 90) -> str:
    d = datetime.now() - timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )
    return d.isoformat()


def _corrupt_record() -> dict:
    """Generate a bad record (missing field / non-numeric quantity) for testing."""
    return {
        "order_id": f"BAD-{random.randint(1, 999)}",
        "product": random.choice(PRODUCTS),
        "region": random.choice(REGIONS),
        "quantity": "N/A",
        "unit_price": random.choice(["FREE", None, ""]),
        "status": "orphaned",
        "timestamp": "2099-01-01T00:00:00",
    }


def _anomalous_record() -> dict:
    """Generate a record with extreme values that will trigger z-score anomaly detection."""
    extreme_quantity = random.choice([random.randint(3000, 10000), random.randint(-500, -50)])
    extreme_price = round(random.uniform(2000.0, 8000.0), 2)
    return {
        "order_id": f"ANOM-{random.randint(10000, 99999)}",
        "product": random.choice(PRODUCTS[-3:]),
        "region": random.choice(REGIONS),
        "quantity": extreme_quantity if random.random() < 0.5 else random.randint(1, 500),
        "unit_price": extreme_price if random.random() < 0.5 else round(random.uniform(5.0, 250.0), 2),
        "status": "shipped",
        "timestamp": _random_ts(30),
    }


def generate_batch(batch_size: int = 500, corrupt_ratio: float = 0.05, anomaly_ratio: float = 0.02) -> list[dict]:
    rows = []
    for i in range(batch_size):
        if random.random() < corrupt_ratio:
            rows.append(_corrupt_record())
            continue
        if random.random() < anomaly_ratio:
            rows.append(_anomalous_record())
            continue
        qty = random.randint(1, 500)
        price = round(random.uniform(5.0, 250.0), 2)
        rows.append(
            {
                "order_id": f"ORD-{random.randint(10000, 99999)}",
                "product": random.choice(PRODUCTS),
                "region": random.choice(REGIONS),
                "quantity": qty,
                "unit_price": price,
                "status": random.choice(STATUSES),
                "timestamp": _random_ts(),
            }
        )
    # inject exact duplicates
    if len(rows) >= 4:
        rows[0] = dict(rows[1])
        rows[2] = dict(rows[1])
    random.shuffle(rows)
    return rows


def seed_landing_zone(
    num_files: int = 5, rows_per_file: int = 2000, corrupt_ratio: float = 0.05, anomaly_ratio: float = 0.02
) -> list[Path]:
    """Write raw CSV files into the mock landing zone."""
    files = []
    for f_idx in range(num_files):
        batch = generate_batch(rows_per_file, corrupt_ratio, anomaly_ratio)
        path = RAW_DIR / f"transactions_{f_idx + 1}.csv"
        with open(path, "w", newline="") as f:
            w = csv.DictWriter(
                f, fieldnames=["order_id", "product", "region", "quantity", "unit_price", "status", "timestamp"]
            )
            w.writeheader()
            w.writerows(batch)
        files.append(path)
    return files


if __name__ == "__main__":
    paths = seed_landing_zone()
    print(f"[LandingZone] Seeded {len(paths)} files → {RAW_DIR}")
