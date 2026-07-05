"""
Multi-source landing zones — simulates ingestion from JSON logs and unstructured text.

Adds two additional source types alongside CSV transactions:
  1. JSON logs — event-based logs with severity, message, service metadata
  2. Text documents — unstructured supply-chain incident reports for NLP analysis

All sources land in the RAW_DIR under subdirectories per source type.
"""
from __future__ import annotations

import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

from backend.config import RAW_DIR

# Ensure sub-directories for each source type
JSON_DIR = RAW_DIR / "json_logs"
TEXT_DIR = RAW_DIR / "text_reports"
TRANSACTIONS_DIR = RAW_DIR  # existing CSV transactions live here

for d in [JSON_DIR, TEXT_DIR]:
    d.mkdir(parents=True, exist_ok=True)

SERVICES = ["order-service", "payment-gateway", "inventory-api", "shipping-worker", "notification-queue"]
LOG_LEVELS = ["INFO", "WARN", "ERROR", "DEBUG"]
EVENT_TYPES = ["order.created", "order.updated", "payment.failed", "inventory.low", "shipment.delayed", "notification.sent"]

TOPICS = [
    "inventory shortage widget-a na-east",
    "supplier delay gadget-x eu-central",
    "quality incident component-z batch #4421",
    "customs clearance delay apac-southeast",
    "temperature excursion during transit",
    "overstock alert widget-b na-west",
    "damaged goods report gadet-y shipment",
]


def generate_json_logs(num_files: int = 3, lines_per_file: int = 100) -> list[Path]:
    """Generate JSON event logs mimicking a microservice observability stream."""
    files = []
    for f_idx in range(num_files):
        path = JSON_DIR / f"service_events_{f_idx + 1}.jsonl"
        with open(path, "w") as f:
            for _ in range(lines_per_file):
                ts = (datetime.now() - timedelta(minutes=random.randint(0, 1440))).isoformat()
                entry = {
                    "timestamp": ts,
                    "service": random.choice(SERVICES),
                    "level": random.choice(LOG_LEVELS),
                    "event": random.choice(EVENT_TYPES),
                    "duration_ms": round(random.uniform(5, 2000), 2),
                    "user_id": f"usr_{random.randint(100, 999)}",
                    "order_ref": f"ORD-{random.randint(10000, 99999)}",
                    "metadata": {
                        "region": random.choice(["na-east", "na-west", "eu-central", "apac-southeast"]),
                        "retry_count": random.randint(0, 3),
                    },
                }
                if random.random() < 0.08:
                    entry["level"] = "ERROR"
                    entry["error"] = random.choice([
                        "Connection timeout",
                        "Rate limit exceeded",
                        "Invalid payload schema",
                        "Upstream service unavailable",
                    ])
                f.write(json.dumps(entry) + "\n")
        files.append(path)
    return files


def generate_text_reports(num_files: int = 3, paragraphs: int = 5) -> list[Path]:
    """Generate unstructured incident report text files for NLP analysis."""
    templates = [
        "Incident Report: {topic}\nDate: {date}\n\n{body}\n\nAction Items:\n{actions}",
    ]
    bodies = [
        "During the routine inventory audit, we observed an unexpected depletion of {product} stock in the {region} warehouse. "
        "The system recorded {count} units below the safety threshold. Initial investigation suggests a discrepancy between "
        "the ERP system and physical stock counts. The procurement team has been notified and a manual reconciliation is underway.",

        "A {severity} anomaly was detected in the {product} supply chain for the {region} region. "
        "The unit price deviated by {pct}% from the 30-day moving average. This may indicate a pricing error or "
        "a sudden market shift. The vendor has been contacted for clarification.",

        "Quality assurance testing on {product} (batch #{batch}) revealed {issue}. "
        "Affected units have been quarantined. Impact assessment estimates {impact} units at risk. "
        "Root cause analysis is ongoing. Recommendations include suspending further shipments from this batch.",
    ]
    actions_list = [
        "- Notify procurement team within 2 hours\n- Initiate manual stock reconciliation\n- Escalate to regional operations manager",
        "- Verify supplier invoice for the affected period\n- Cross-reference with market index data\n- Schedule price review meeting",
        "- Quarantine all affected units\n- Notify quality assurance lead\n- Prepare replacement shipment from alternate batch",
    ]

    products = ["Widget-A", "Widget-B", "Gadget-X", "Gadget-Y", "Component-Z"]
    regions = ["NA-East", "NA-West", "EU-Central", "APAC-Southeast"]

    files = []
    for f_idx in range(num_files):
        path = TEXT_DIR / f"incident_report_{f_idx + 1}.txt"
        date = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d")
        severity = random.choice(["minor", "moderate", "critical"])
        product = random.choice(products)
        region = random.choice(regions)

        body = random.choice(bodies).format(
            product=product, region=region, severity=severity,
            count=random.randint(50, 500), pct=round(random.uniform(5, 40), 1),
            batch=random.randint(4400, 4500), issue=random.choice([
                "temperature deviation during storage", "labeling error on packaging",
                "contamination detected in sample testing",
            ]), impact=random.randint(100, 2000),
        )
        actions = random.choice(actions_list)

        content = random.choice(templates).format(
            topic=random.choice(TOPICS), date=date, body=body, actions=actions,
        )
        with open(path, "w") as f:
            f.write(content)
        files.append(path)
    return files


# ── Transportation Seeding ─────────────────────────────────────


ROUTES = ["R-101", "R-102", "R-201", "R-202", "R-301"]
FACILITY_TYPES = ["warehouse", "port", "hub", "depot"]


def generate_transport_csv(num_files: int = 5, rows_per_file: int = 2000) -> list[Path]:
    """Generate CSV trip records with transit times for transportation persona."""
    from backend.ingest.landing_zone import _random_ts

    files = []
    for f_idx in range(num_files):
        path = RAW_DIR / f"routes_{f_idx + 1}.csv"
        with open(path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["trip_id", "route_id", "region", "transit_minutes", "distance_km", "status", "departure_ts"])
            w.writeheader()
            for _ in range(rows_per_file):
                row = {
                    "trip_id": f"TRIP-{random.randint(10000, 99999)}",
                    "route_id": random.choice(ROUTES),
                    "region": random.choice(["NA-East", "NA-West", "EU-Central", "APAC-Southeast"]),
                    "transit_minutes": random.randint(20, 300),
                    "distance_km": round(random.uniform(5, 200), 1),
                    "status": random.choice(["on_time", "delayed", "completed", "cancelled"]),
                    "departure_ts": _random_ts(30),
                }
                if random.random() < 0.02:
                    row["transit_minutes"] = random.randint(600, 2000)
                    row["status"] = "delayed"
                w.writerow(row)
        files.append(path)
    return files


def generate_transport_json(num_files: int = 3, lines_per_file: int = 100) -> list[Path]:
    """Generate traffic sensor JSON logs."""
    files = []
    for f_idx in range(num_files):
        path = JSON_DIR / f"traffic_sensors_{f_idx + 1}.jsonl"
        with open(path, "w") as f:
            for _ in range(lines_per_file):
                ts = (datetime.now() - timedelta(minutes=random.randint(0, 1440))).isoformat()
                entry = {
                    "timestamp": ts,
                    "sensor_id": f"SENS-{random.randint(100, 999)}",
                    "route_id": random.choice(ROUTES),
                    "congestion_level": random.choice(["low", "moderate", "heavy", "severe"]),
                    "avg_speed_kmh": round(random.uniform(10, 110), 1),
                    "vehicle_count": random.randint(10, 500),
                    "incident": random.choice(["none", "accident", "construction", "weather", "none", "none"]),
                }
                f.write(json.dumps(entry) + "\n")
        files.append(path)
    return files


def generate_transport_text(num_files: int = 3) -> list[Path]:
    """Generate route delay report text files."""
    files = []
    templates = [
        "Route Delay Report: {route}\nDate: {date}\n\n{body}\n\nAction Items:\n{actions}",
    ]
    bodies = [
        "Route {route} in the {region} region experienced an average delay of {delay} minutes over the past week. "
        "The primary cause appears to be congestion at the {city} checkpoint during peak hours. "
        "Alternative routing via {alt_route} is recommended to reduce transit times.",
        "A {severity} incident was reported on route {route} near {city}. "
        "Traffic sensors indicate a {pct}% reduction in average speed compared to the same period last month. "
        "Dispatch has been notified and rerouting is under evaluation.",
    ]
    actions_list = [
        "- Divert 30% of traffic to alternate route\n- Notify dispatch team\n- Schedule road condition review",
        "- Deploy traffic management at checkpoint\n- Communicate ETA changes to customers\n- Evaluate long-term route optimization",
    ]
    cities = ["Chicago Hub", "Atlanta Junction", "Dallas Interchange", "LA Gateway", "NY Terminal"]
    regions = ["NA-East", "NA-West", "EU-Central", "APAC-Southeast"]

    for f_idx in range(num_files):
        path = TEXT_DIR / f"route_report_{f_idx + 1}.txt"
        date = (datetime.now() - timedelta(days=random.randint(0, 14))).strftime("%Y-%m-%d")
        body = random.choice(bodies).format(
            route=random.choice(ROUTES), region=random.choice(regions),
            delay=random.randint(15, 120), city=random.choice(cities),
            alt_route=random.choice(ROUTES), severity=random.choice(["minor", "moderate", "critical"]),
            pct=random.randint(15, 50),
        )
        actions = random.choice(actions_list)
        content = random.choice(templates).format(
            route=random.choice(ROUTES), date=date, body=body, actions=actions,
        )
        with open(path, "w") as f:
            f.write(content)
        files.append(path)
    return files


# ── Health Seeding ─────────────────────────────────────────────


FACILITIES = ["general-hospital", "clinic-a", "clinic-b", "health-center", "field-hospital"]


def generate_health_csv(num_files: int = 5, rows_per_file: int = 2000) -> list[Path]:
    """Generate CSV patient case records for health persona."""
    from backend.ingest.landing_zone import _random_ts

    files = []
    for f_idx in range(num_files):
        path = RAW_DIR / f"patients_{f_idx + 1}.csv"
        with open(path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["case_id", "region", "facility_type", "case_count", "response_hours", "status", "reported_ts"])
            w.writeheader()
            for _ in range(rows_per_file):
                row = {
                    "case_id": f"CS-{random.randint(10000, 99999)}",
                    "region": random.choice(["NA-East", "NA-West", "EU-Central", "APAC-Southeast"]),
                    "facility_type": random.choice(FACILITIES),
                    "case_count": random.randint(0, 50),
                    "response_hours": round(random.uniform(0.5, 48), 1),
                    "status": random.choice(["reported", "investigating", "contained", "resolved", "monitoring"]),
                    "reported_ts": _random_ts(60),
                }
                if random.random() < 0.02:
                    row["case_count"] = random.randint(200, 1000)
                    row["status"] = "outbreak"
                w.writerow(row)
        files.append(path)
    return files


def generate_health_json(num_files: int = 3, lines_per_file: int = 100) -> list[Path]:
    """Generate lab result JSON logs."""
    files = []
    for f_idx in range(num_files):
        path = JSON_DIR / f"lab_results_{f_idx + 1}.jsonl"
        with open(path, "w") as f:
            for _ in range(lines_per_file):
                ts = (datetime.now() - timedelta(hours=random.randint(0, 72))).isoformat()
                entry = {
                    "timestamp": ts,
                    "lab_id": f"LAB-{random.randint(10, 99)}",
                    "region": random.choice(["NA-East", "NA-West", "EU-Central", "APAC-Southeast"]),
                    "test_type": random.choice(["pcr", "antigen", "serology", "culture"]),
                    "positive_rate": round(random.uniform(0.01, 0.35), 3),
                    "samples_processed": random.randint(50, 2000),
                    "turnaround_hours": round(random.uniform(2, 72), 1),
                }
                f.write(json.dumps(entry) + "\n")
        files.append(path)
    return files


def generate_health_text(num_files: int = 3) -> list[Path]:
    """Generate outbreak report text files."""
    files = []
    templates = [
        "Outbreak Report: {region}\nDate: {date}\n\n{body}\n\nAction Items:\n{actions}",
    ]
    bodies = [
        "A {severity} outbreak of {disease} has been identified in the {region} region. "
        "Cases have increased by {pct}% over the past {days} days, with {facility} reporting the highest concentration. "
        "Rapid response teams are being deployed. Quarantine measures are under evaluation.",
        "Surveillance data from {region} indicates an unusual cluster of {disease} cases near {facility}. "
        "The reproductive number (R0) is estimated at {r0}. "
        "Contact tracing is underway and additional testing capacity has been requested.",
    ]
    actions_list = [
        "- Deploy mobile testing units to affected area\n- Activate emergency operations center\n- Coordinate with regional health authorities",
        "- Issue public health advisory\n- Stockpile PPE and medical supplies\n- Prepare isolation wards at {facility}",
    ]
    diseases = ["Influenza A", "Dengue Fever", "Cholera", "Measles", "Novel Coronavirus"]
    regions = ["NA-East", "NA-West", "EU-Central", "APAC-Southeast"]

    for f_idx in range(num_files):
        path = TEXT_DIR / f"outbreak_report_{f_idx + 1}.txt"
        date = (datetime.now() - timedelta(days=random.randint(0, 14))).strftime("%Y-%m-%d")
        region = random.choice(regions)
        body = random.choice(bodies).format(
            severity=random.choice(["minor", "moderate", "critical", "emergency"]),
            disease=random.choice(diseases), region=region,
            pct=random.randint(30, 200), days=random.randint(3, 21),
            facility=random.choice(FACILITIES), r0=round(random.uniform(1.1, 3.5), 1),
        )
        actions = random.choice(actions_list).format(facility=random.choice(FACILITIES))
        content = random.choice(templates).format(region=region, date=date, body=body, actions=actions)
        with open(path, "w") as f:
            f.write(content)
        files.append(path)
    return files


# ── Unified Seeder ─────────────────────────────────────────────


def seed_all_sources(
    persona_id: str = "supply_chain",
    num_csv_files: int = 5,
    csv_rows: int = 2000,
    num_json_files: int = 3,
    json_lines: int = 100,
    num_text_files: int = 3,
) -> dict[str, list[Path]]:
    """Seed data for the given persona.
    
    Args:
        persona_id: one of "supply_chain", "transportation", "health"
    """
    from backend.ingest.landing_zone import seed_landing_zone

    if persona_id == "transportation":
        return {
            "csv": generate_transport_csv(num_csv_files, csv_rows),
            "json_logs": generate_transport_json(num_json_files, json_lines),
            "text_reports": generate_transport_text(num_text_files),
        }
    elif persona_id == "health":
        return {
            "csv": generate_health_csv(num_csv_files, csv_rows),
            "json_logs": generate_health_json(num_json_files, json_lines),
            "text_reports": generate_health_text(num_text_files),
        }
    else:
        return {
            "csv": seed_landing_zone(num_csv_files, csv_rows),
            "json_logs": generate_json_logs(num_json_files, json_lines),
            "text_reports": generate_text_reports(num_text_files),
        }


if __name__ == "__main__":
    for pid in ("supply_chain", "transportation", "health"):
        sources = seed_all_sources(pid)
        print(f"[{pid}] CSV: {len(sources['csv'])} | JSON: {len(sources['json_logs'])} | Text: {len(sources['text_reports'])}")
