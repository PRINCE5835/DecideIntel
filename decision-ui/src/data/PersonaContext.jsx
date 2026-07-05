import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { personas as defaultPersonas, alerts as defaultAlerts, forecastData as defaultForecast, anomalyTimeline as defaultTimeline, llmRecommendation as defaultLLM } from "./mockData";

const PersonaContext = createContext(null);

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ZERO_TIMELINE = DAYS.map((day) => ({ day, value: 0, anomaly: false }));
const ZERO_FORECAST = [
  { product: "—", region: "—", current: 0, forecast: 0, lower: 0, upper: 0 },
];

let nextId = 100;

export function dataForPersona(p) {
  if (!p || typeof p !== "object") {
    return {
      anomalyTimeline: ZERO_TIMELINE,
      forecastData: ZERO_FORECAST,
      alerts: [],
      llmRecommendation: "No persona selected. Please select a persona to view insights.",
      anomalyCount: 0,
      stats: { latencyReduction: 0, forecastGain: 0, resolvedAlerts: 0 },
    };
  }
  const name = p.name || "User";
  const rawId = p.id;
  const id = typeof rawId === "number" ? rawId : (String(rawId)?.charCodeAt(0) || 65) + name.length * 10 || 42;
  const seed = Math.max(id, 1) * 7 + 13;
  const r = (n, min = 50, max = 250) => {
    const v = ((seed * (n + 1) * 31 + n * 17) % (Math.max(max - min, 1))) + min;
    return Math.round(v);
  };
  const anomalyTimeline = DAYS.map((day, i) => ({
    day,
    value: r(i, 60, 280),
    anomaly: i === 2 || i === 5,
  }));
  const forecastData = [
    { product: "Alpha-X", region: "NA-East", current: r(0, 3000, 8000), forecast: r(1, 4000, 9000), lower: r(2, 3000, 7000), upper: r(3, 5000, 10000) },
    { product: "Beta-Y", region: "APAC", current: r(4, 2000, 6000), forecast: r(5, 3000, 7000), lower: r(6, 2000, 5000), upper: r(7, 4000, 8000) },
    { product: "Gamma-Z", region: "EU-Central", current: r(8, 4000, 9000), forecast: r(9, 5000, 10000), lower: r(10, 4000, 8000), upper: r(11, 6000, 11000) },
    { product: "Delta-W", region: "APAC-South", current: r(12, 1000, 4000), forecast: r(13, 2000, 5000), lower: r(14, 1000, 3000), upper: r(15, 3000, 6000) },
    { product: "Epsilon-V", region: "NA-West", current: r(16, 5000, 10000), forecast: r(17, 6000, 11000), lower: r(18, 5000, 9000), upper: r(19, 7000, 12000) },
  ];
  const anomalies = anomalyTimeline.filter((d) => d.anomaly).length;
  const firstName = name.split(" ")[0] || name;
  const alerts = [
    { id: 200 + id, severity: "CRITICAL", message: `${firstName} anomaly: ${forecastData[0]?.product ?? "N/A"} in ${forecastData[0]?.region ?? "N/A"}`, action: "Verify supplier pricing within 2h", time: "2 min ago" },
    { id: 201 + id, severity: "WARNING", message: `Volume spike: ${forecastData[1]?.product ?? "N/A"} in ${forecastData[1]?.region ?? "N/A"}`, action: "Check for duplicate orders", time: "15 min ago" },
    { id: 202 + id, severity: "INFO", message: `Recurring anomaly: ${forecastData[2]?.product ?? "N/A"} in ${forecastData[2]?.region ?? "N/A"}`, action: "Schedule supplier audit", time: "1h ago" },
  ];
  const bottleneckMin = Math.max(Math.round(r(0, 5, 60)), 1);
  const reduction = Math.round(r(1, 80, 98));
  const f = (i) => forecastData[i] ?? { product: "N/A", region: "N/A" };
  const llmRecommendation = `**Decision Recommendation for ${name}**\n\n1. **Priority 1 — ${f(0).product} (${f(0).region}):** Price anomaly detected. Hold replenishment for 2 hours and verify supplier pricing.\n2. **Priority 2 — ${f(1).product} (${f(1).region}):** Demand forecast up ${Math.round(r(2, 10, 40))}%. Expedite ${Math.max(r(3, 1000, 5000), 0)} units from regional warehouse.\n3. **Priority 3 — ${f(2).product} (${f(2).region}):** Volume spike flagged. Check for duplicate orders before processing.\n\n⚠ **Risk Escalation:** ${f(3).product} in ${f(3).region} shows recurring anomalies — recommend supplier audit.\n\n> "Projected to reduce decision latency from ${bottleneckMin}m to ${Math.round(Math.max(bottleneckMin * 0.05, 1))}m (${reduction}% improvement)."`;
  const latencyReduction = Math.round(r(1, 82, 97));
  const forecastGain = Math.round(r(2, 14, 32));
  const resolvedAlerts = anomalies;
  return { anomalyTimeline, forecastData, alerts, llmRecommendation, anomalyCount: anomalies, stats: { latencyReduction, forecastGain, resolvedAlerts } };
}

export function PersonaProvider({ children }) {
  const [personas, setPersonas] = useState(defaultPersonas);
  const [activePersonaId, setActivePersonaId] = useState(defaultPersonas[0].id);

  const activePersona = useMemo(() => personas.find((p) => p.id === activePersonaId) || personas[0] || null, [personas, activePersonaId]);

  const selectPersona = useCallback((id) => {
    setActivePersonaId(id);
  }, []);

  const addPersona = useCallback((newPersona) => {
    const id = nextId++;
    const initials = newPersona.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const colors = ["#0066FF", "#4CAF50", "#FF6B35", "#9C27B0", "#E91E63", "#00BCD4", "#FF9800", "#795548"];
    const color = colors[id % colors.length];
    const persona = {
      id,
      name: newPersona.name,
      role: newPersona.role,
      initials,
      color,
      bottleneck: newPersona.bottleneck || "Decision latency > 30 min",
      stats: { pipelines: 0, decisions: 0, impact: "+0%" },
    };
    setPersonas((prev) => [...prev, persona]);
    return persona;
  }, []);

  const removePersona = useCallback((id) => {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
    if (activePersonaId === id) {
      setActivePersonaId(personas[0]?.id || null);
    }
  }, [activePersonaId, personas]);

  const value = useMemo(() => ({
    personas,
    activePersona,
    activePersonaId,
    selectPersona,
    addPersona,
    removePersona,
    dataForPersona,
  }), [personas, activePersona, activePersonaId, selectPersona, addPersona, removePersona]);

  return (
    <PersonaContext.Provider value={value}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used within PersonaProvider");
  return ctx;
}
