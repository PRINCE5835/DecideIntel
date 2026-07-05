import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AlertTriangle, TrendingUp, Lightbulb, Zap, CheckCircle2, Sliders } from "lucide-react";
import { usePersona, dataForPersona } from "../data/PersonaContext";

const ZERO_TIMELINE = [
  { day: "Mon", value: 0, anomaly: false },
  { day: "Tue", value: 0, anomaly: false },
  { day: "Wed", value: 0, anomaly: false },
  { day: "Thu", value: 0, anomaly: false },
  { day: "Fri", value: 0, anomaly: false },
  { day: "Sat", value: 0, anomaly: false },
  { day: "Sun", value: 0, anomaly: false },
];
const ZERO_FORECAST = [
  { product: "—", region: "—", current: 0, forecast: 0, lower: 0, upper: 0 },
];
const ZERO_STATS = { latencyReduction: 0, forecastGain: 0, resolvedAlerts: 0 };

function SkeletonCard({ className }) {
  return (
    <div className={`bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm p-6 ${className ?? ""}`}>
      <div className="animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-slate-200 dark:bg-dark-border" />
          <div className="h-5 w-48 rounded bg-slate-200 dark:bg-dark-border" />
        </div>
        <div className="h-56 rounded-xl bg-slate-100 dark:bg-dark-border" />
      </div>
    </div>
  );
}

const AnomalyChart = ({ data }) => {
  const memoData = useMemo(() => (Array.isArray(data) && data.length ? data : ZERO_TIMELINE), [data]);
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={memoData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2F0F0" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E2F0F0",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0066FF"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload?.anomaly) {
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={6} fill="#EF4444" opacity={0.2}>
                      <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={cx} cy={cy} r={4} fill="#EF4444" />
                  </g>
                );
              }
              return <circle cx={cx} cy={cy} r={3} fill="#0066FF" />;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const AlertsPanel = ({ alerts, onResolve, resolved }) => {
  const [activeAlert, setActiveAlert] = useState(null);
  const safeAlerts = useMemo(() => (Array.isArray(alerts) ? alerts : []), [alerts]);
  return (
    <div className="space-y-3">
      {safeAlerts.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-dark-muted text-center py-4">No active alerts</p>
      )}
      {safeAlerts.map((alert, i) => {
        if (!alert?.id) return null;
        const isResolved = resolved?.has(alert.id) ?? false;
        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            onMouseEnter={() => setActiveAlert(alert.id)}
            onMouseLeave={() => setActiveAlert(null)}
            className={`p-3 rounded-xl border transition-all ${
              isResolved
                ? "bg-green-50/50 border-green-200 opacity-60"
                : activeAlert === alert.id
                ? "shadow-md border-slate-200"
                : "border-slate-100"
            } ${
              !isResolved && alert.severity === "CRITICAL"
                ? "bg-red-50/50"
                : !isResolved && alert.severity === "WARNING"
                ? "bg-amber-50/50"
                : !isResolved && "bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  isResolved ? "bg-green-400" : alert.severity === "CRITICAL" ? "bg-red-500" : alert.severity === "WARNING" ? "bg-amber-500" : "bg-blue-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isResolved ? "text-slate-400 line-through" : "text-slate-700 dark:text-dark-text"}`}>
                  {isResolved ? "Resolved: " : ""}{alert.message ?? ""}
                </p>
                <p className="text-xs text-slate-400 dark:text-dark-muted mt-0.5">{alert.action ?? ""}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isResolved ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <button
                    onClick={() => onResolve(alert.id)}
                    className="px-2 py-1 rounded-lg bg-[#0066FF]/5 text-[#0066FF] text-xs font-medium border border-[#0066FF]/10 hover:bg-[#0066FF]/10 transition-colors"
                  >
                    Resolve
                  </button>
                )}
                <span className="text-xs text-slate-400 dark:text-dark-muted">{alert.time ?? ""}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const ForecastList = ({ data }) => {
  const memoData = useMemo(() => (Array.isArray(data) && data.length ? data : ZERO_FORECAST), [data]);
  return (
    <div className="space-y-2.5">
      {memoData.map((f, i) => (
        <motion.div
          key={f?.product + f?.region ?? i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 + i * 0.07 }}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-dark-border/50"
        >
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-dark-text">{f?.product ?? "—"}</p>
            <p className="text-xs text-slate-400 dark:text-dark-muted">{f?.region ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#0066FF]">{(f?.forecast ?? 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 dark:text-dark-muted">
              [{(f?.lower ?? 0).toLocaleString()}–{(f?.upper ?? 0).toLocaleString()}]
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

function applySimulation(data, params) {
  if (!data) return { anomalyTimeline: ZERO_TIMELINE, forecastData: ZERO_FORECAST, alerts: [], llmRecommendation: "", anomalyCount: 0, stats: ZERO_STATS };
  const factor = 1 + ((params?.sensitivity ?? 50) - 50) / 100 * 0.6 + ((params?.volatility ?? 50) - 50) / 100 * 0.3;
  const threshold = params?.threshold ?? 150;
  const timeline = Array.isArray(data.anomalyTimeline) ? data.anomalyTimeline : ZERO_TIMELINE;
  const forecast = Array.isArray(data.forecastData) ? data.forecastData : ZERO_FORECAST;
  return {
    ...data,
    anomalyTimeline: timeline.map((d) => ({
      ...d,
      value: Math.round((d?.value ?? 0) * factor),
      anomaly: (d?.value ?? 0) * factor > threshold,
    })),
    forecastData: forecast.map((f) => ({
      ...f,
      forecast: Math.round((f?.forecast ?? 0) * factor),
      lower: Math.round((f?.lower ?? 0) * factor * 0.9),
      upper: Math.round((f?.upper ?? 0) * factor * 1.1),
    })),
  };
}

export default function Beat3_DecisionHub() {
  const { activePersona } = usePersona();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ sensitivity: 50, volatility: 50, threshold: 150 });
  const [showToast, setShowToast] = useState(null);
  const [resolved, setResolved] = useState(new Set());

  const baseData = useMemo(() => {
    if (!activePersona) return null;
    try {
      return dataForPersona(activePersona);
    } catch {
      return null;
    }
  }, [activePersona]);

  const personaData = useMemo(() => applySimulation(baseData, {
    sensitivity: params?.sensitivity ?? 50,
    volatility: params?.volatility ?? 50,
    threshold: params?.threshold ?? 150,
  }), [baseData, params]);

  const anomalyCount = useMemo(() => {
    if (!Array.isArray(personaData?.anomalyTimeline)) return 0;
    return personaData.anomalyTimeline.filter((d) => d?.anomaly).length;
  }, [personaData]);

  const handleSlider = useCallback((key, value) => {
    setParams((p) => ({ ...p, [key]: value }));
  }, []);

  const handleResolve = useCallback((id) => {
    setResolved((prev) => new Set([...prev, id]));
    setShowToast(id);
    setTimeout(() => setShowToast(null), 2500);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <motion.div
        key="decisions-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-8"
      >
        <div className="mb-8 animate-pulse">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-dark-border mb-3" />
          <div className="h-8 w-96 rounded bg-slate-200 dark:bg-dark-border mb-2" />
          <div className="h-5 w-64 rounded bg-slate-100 dark:bg-dark-border" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
        <div className="mb-6">
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
        </div>
      </motion.div>
    );
  }

  const safeData = personaData || { anomalyTimeline: ZERO_TIMELINE, forecastData: ZERO_FORECAST, alerts: [], llmRecommendation: "", anomalyCount: 0, stats: ZERO_STATS };
  const personaName = activePersona?.name ?? "User";

  return (
    <motion.div
      key="decisions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="pt-8"
    >
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
            Live
          </span>
          <span className="text-sm text-slate-400">Pipeline complete — decisions ready</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-dark-text tracking-tight mb-1">Decision Intelligence Hub</h1>
        <p className="text-slate-500 dark:text-dark-muted">
          Actionable insights for <span className="font-medium text-slate-700 dark:text-dark-text">{personaName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-500 dark:text-dark-muted" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-dark-text">Anomaly Detection Trend</h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
              {anomalyCount} anomalies detected
            </span>
          </div>
          {safeData.anomalyTimeline && <AnomalyChart data={safeData.anomalyTimeline} />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-slate-500 dark:text-dark-muted" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-dark-text">Active Alerts</h2>
            </div>
            <span className="text-xs text-slate-400 dark:text-dark-muted">{safeData.alerts?.length ?? 0} new</span>
          </div>
          <AlertsPanel alerts={safeData.alerts} onResolve={handleResolve} resolved={resolved} />
        </motion.div>
      </div>

      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Sliders className="w-5 h-5 text-slate-500 dark:text-dark-muted" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-dark-text">Simulation Parameter Control</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { key: "sensitivity", label: "Sensitivity", min: 10, max: 100, desc: "Anomaly detection sensitivity" },
              { key: "volatility", label: "Volatility", min: 10, max: 100, desc: "Market volatility factor" },
              { key: "threshold", label: "Threshold", min: 80, max: 300, desc: "Anomaly alert threshold" },
            ].map(({ key, label, min, max, desc }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-dark-text">{label}</label>
                  <span className="text-xs font-semibold text-[#0066FF] bg-[#0066FF]/5 px-2 py-0.5 rounded-lg">{(params ?? {})[key] ?? 50}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={(params ?? {})[key] ?? 50}
                  onChange={(e) => handleSlider(key, Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-[#0066FF] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0066FF] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,102,255,0.3)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                />
                <p className="text-xs text-slate-400 dark:text-dark-muted mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-1 bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-500 dark:text-dark-muted" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-dark-text">Demand Forecast</h2>
            </div>
          </div>
          {safeData.forecastData && <ForecastList data={safeData.forecastData} />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-dark-text">LLM Recommendation</h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">
              Gemini AI
            </span>
          </div>

          {safeData.stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="p-4 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#4F8CFF] text-white"
              >
                <Zap className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{safeData.stats.latencyReduction ?? 0}%</p>
                <p className="text-xs text-white/80">Decision latency reduction</p>
              </motion.div>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 text-white"
              >
                <TrendingUp className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{safeData.stats.forecastGain ?? 0}%</p>
                <p className="text-xs text-white/80">Forecast accuracy gain</p>
              </motion.div>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white"
              >
                <AlertTriangle className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{safeData.stats.resolvedAlerts ?? 0}</p>
                <p className="text-xs text-white/80">Critical alerts resolved</p>
              </motion.div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-border/50 border border-slate-100 dark:border-dark-border">
            <p className="text-sm text-slate-700 dark:text-dark-text whitespace-pre-line leading-relaxed">
              {safeData.llmRecommendation || "No recommendation available."}
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 40, x: "-50%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-8 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-green-50 border border-green-200 shadow-lg shadow-green-200/40"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Alert resolved and automated successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
