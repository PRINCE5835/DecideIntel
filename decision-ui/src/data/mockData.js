export const personas = [
  {
    id: 1,
    name: "Alex Chen",
    role: "Supply Chain Operations Manager",
    initials: "AC",
    color: "#0066FF",
    bottleneck: "Inventory replenishment decision latency > 4 hours",
    stats: { pipelines: 142, decisions: 89, impact: "+32%" },
  },
  {
    id: 2,
    name: "Maya Patel",
    role: "Transportation Planner",
    initials: "MP",
    color: "#4CAF50",
    bottleneck: "Traffic reroute response time > 15 min",
    stats: { pipelines: 98, decisions: 156, impact: "+28%" },
  },
  {
    id: 3,
    name: "James Okonkwo",
    role: "Community Health Officer",
    initials: "JO",
    color: "#FF6B35",
    bottleneck: "Epidemic alert lag > 6 hours",
    stats: { pipelines: 67, decisions: 234, impact: "+45%" },
  },
];

export const pipelineStages = [
  { id: "ingest", label: "Ingest", icon: "📥", status: "done" },
  { id: "normalize", label: "Normalize", icon: "🧹", status: "done" },
  { id: "dedup", label: "Deduplicate", icon: "🔁", status: "done" },
  { id: "filter", label: "Filter", icon: "📋", status: "done" },
  { id: "analyze", label: "Analyze", icon: "📊", status: "done" },
  { id: "decide", label: "Decide", icon: "✅", status: "done" },
];

export const benchmarkData = [
  { operation: "Feature Aggregation", cpu: 0.042, gpu: 0.008, rows: 10000 },
  { operation: "Trend Join (Merge)", cpu: 0.028, gpu: 0.006, rows: 10000 },
  { operation: "Anomaly Detection", cpu: 0.035, gpu: 0.005, rows: 10000 },
];

export const forecastData = [
  { product: "Widget-A", region: "NA-East", current: 5842, forecast: 7120, lower: 6052, upper: 8188 },
  { product: "Widget-B", region: "NA-West", current: 3210, forecast: 4050, lower: 3443, upper: 4658 },
  { product: "Gadget-X", region: "EU-Central", current: 4891, forecast: 5230, lower: 4446, upper: 6015 },
  { product: "Gadget-Y", region: "APAC-South", current: 2105, forecast: 3120, lower: 2652, upper: 3588 },
  { product: "Component-Z", region: "NA-East", current: 7650, forecast: 8100, lower: 6885, upper: 9315 },
];

export const alerts = [
  { id: 1, severity: "CRITICAL", message: "Price anomaly: Gadget-X in NA-East", action: "Verify supplier pricing within 2h", time: "2 min ago" },
  { id: 2, severity: "WARNING", message: "Volume spike: Widget-A in APAC", action: "Check for duplicate orders", time: "15 min ago" },
  { id: 3, severity: "INFO", message: "Recurring anomaly: Gadget-Y in EU", action: "Schedule supplier audit", time: "1h ago" },
];

export const anomalyTimeline = [
  { day: "Mon", value: 120, anomaly: false },
  { day: "Tue", value: 115, anomaly: false },
  { day: "Wed", value: 190, anomaly: true },
  { day: "Thu", value: 110, anomaly: false },
  { day: "Fri", value: 105, anomaly: false },
  { day: "Sat", value: 200, anomaly: true },
  { day: "Sun", value: 130, anomaly: false },
];

export const llmRecommendation = `**Decision Recommendation**

1. **Priority 1 — Gadget-X (NA-East):** Price anomaly detected. Hold replenishment for 2 hours and verify supplier pricing.
2. **Priority 2 — Widget-A (APAC):** Demand forecast up 22%. Expedite 2,000 units from regional warehouse.
3. **Priority 3 — Component-Z (EU):** Volume spike flagged. Check for duplicate orders before processing.

⚠ **Risk Escalation:** Gadget-Y in EU-Central shows recurring anomalies — recommend supplier audit.

> "Projected to reduce decision latency from 4h to 12min (95% improvement)."`;
