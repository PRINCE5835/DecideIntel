import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { personas as defaultPersonas, alerts as defaultAlerts, forecastData as defaultForecast, anomalyTimeline as defaultTimeline, llmRecommendation as defaultLLM } from "./mockData";

const PersonaContext = createContext(null);

let nextId = 100;

export function dataForPersona(p) {
  const id = typeof p.id === "number" ? p.id : p.id.charCodeAt(0) + p.name.length * 10;
  const seed = id * 7 + 13;
  const r = (n, min = 50, max = 250) => {
    const v = ((seed * (n + 1) * 31 + n * 17) % (max - min)) + min;
    return Math.round(v);
  };
  const anomalyTimeline = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
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
  const alerts = [
    { id: 200 + id, severity: "CRITICAL", message: `${p.name.split(" ")[0]} anomaly: ${forecastData[0].product} in ${forecastData[0].region}`, action: "Verify supplier pricing within 2h", time: "2 min ago" },
    { id: 201 + id, severity: "WARNING", message: `Volume spike: ${forecastData[1].product} in ${forecastData[1].region}`, action: "Check for duplicate orders", time: "15 min ago" },
    { id: 202 + id, severity: "INFO", message: `Recurring anomaly: ${forecastData[2].product} in ${forecastData[2].region}`, action: "Schedule supplier audit", time: "1h ago" },
  ];
  const bottleneckMin = Math.round(r(0, 5, 60));
  const reduction = Math.round(r(1, 80, 98));
  const llmRecommendation = `**Decision Recommendation for ${p.name}**\n\n1. **Priority 1 — ${forecastData[0].product} (${forecastData[0].region}):** Price anomaly detected. Hold replenishment for 2 hours and verify supplier pricing.\n2. **Priority 2 — ${forecastData[1].product} (${forecastData[1].region}):** Demand forecast up ${Math.round(r(2, 10, 40))}%. Expedite ${r(3, 1000, 5000)} units from regional warehouse.\n3. **Priority 3 — ${forecastData[2].product} (${forecastData[2].region}):** Volume spike flagged. Check for duplicate orders before processing.\n\n⚠ **Risk Escalation:** ${forecastData[3].product} in ${forecastData[3].region} shows recurring anomalies — recommend supplier audit.\n\n> "Projected to reduce decision latency from ${bottleneckMin}m to ${Math.round(bottleneckMin * 0.05)}m (${reduction}% improvement)."`;
  const latencyReduction = Math.round(r(1, 82, 97));
  const forecastGain = Math.round(r(2, 14, 32));
  const resolvedAlerts = anomalies;
  return { anomalyTimeline, forecastData, alerts, llmRecommendation, anomalyCount: anomalies, stats: { latencyReduction, forecastGain, resolvedAlerts } };
}

export function PersonaProvider({ children }) {
  const [personas, setPersonas] = useState(defaultPersonas);
  const [activePersonaId, setActivePersonaId] = useState(defaultPersonas[0].id);

  const activePersona = useMemo(() => personas.find((p) => p.id === activePersonaId) || personas[0], [personas, activePersonaId]);

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
