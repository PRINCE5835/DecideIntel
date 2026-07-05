"""
Persona configuration — defines data schemas, column mappings, and thresholds
for each supported decision persona.

New personas can be added here without touching pipeline/analysis modules.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class PersonaConfig:
    id: str
    name: str
    role: str
    initials: str
    color: str
    bottleneck: str

    # Data seeding
    data_type: str
    metric_columns: list[str]
    group_columns: list[str]
    id_column: str
    timestamp_column: str
    region_column: str

    # Analysis thresholds
    anomaly_z_threshold: float = 2.0
    alert_critical_z: float = 3.5

    # Seed parameters
    csv_files: int = 5
    csv_rows: int = 2000
    json_files: int = 3
    json_lines: int = 100
    text_files: int = 3


SUPPLY_CHAIN = PersonaConfig(
    id="supply_chain",
    name="Alex Chen",
    role="Supply Chain Operations Manager",
    initials="AC",
    color="#0066FF",
    bottleneck="Inventory replenishment decision latency > 4 hours",
    data_type="transactions",
    metric_columns=["quantity", "unit_price"],
    group_columns=["product", "region"],
    id_column="order_id",
    timestamp_column="timestamp",
    region_column="region",
)

TRANSPORTATION = PersonaConfig(
    id="transportation",
    name="Maya Patel",
    role="Transportation Planner",
    initials="MP",
    color="#4CAF50",
    bottleneck="Traffic reroute response time > 15 min",
    data_type="routes",
    metric_columns=["transit_minutes", "distance_km"],
    group_columns=["route_id", "region"],
    id_column="trip_id",
    timestamp_column="departure_ts",
    region_column="region",
)

HEALTH = PersonaConfig(
    id="health",
    name="James Okonkwo",
    role="Community Health Officer",
    initials="JO",
    color="#FF6B35",
    bottleneck="Epidemic alert lag > 6 hours",
    data_type="patients",
    metric_columns=["case_count", "response_hours"],
    group_columns=["region", "facility_type"],
    id_column="case_id",
    timestamp_column="reported_ts",
    region_column="region",
)

PERSONA_MAP: dict[str, PersonaConfig] = {
    "supply_chain": SUPPLY_CHAIN,
    "transportation": TRANSPORTATION,
    "health": HEALTH,
}
