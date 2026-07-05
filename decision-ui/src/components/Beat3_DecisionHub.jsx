import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AlertTriangle, TrendingUp, Lightbulb, Zap, CheckCircle2, Sliders } from "lucide-react";
import { usePersona, dataForPersona } from "../data/PersonaContext";

const AnomalyChart = ({ data }) => {
  const memoData = useMemo(() => data, [data]);
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={memoData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E2E8F0",
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
              if (payload.anomaly) {
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
  return (
    <div className="space-y-3">
      {alerts.map((alert, i) => {
        const isResolved = resolved.has(alert.id);
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
                <p className={`text-sm font-medium ${isResolved ? "text-slate-400 line-through" : "text-slate-700"}`}>
                  {isResolved ? "Resolved: " : ""}{alert.message}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{alert.action}</p>
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
                <span className="text-xs text-slate-400">{alert.time}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const ForecastList = ({ data }) => {
  const memoData = useMemo(() => data, [data]);
  return (
    <div className="space-y-2.5">
      {memoData.map((f, i) => (
        <motion.div
          key={f.product + f.region}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 + i * 0.07 }}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50"
        >
          <div>
            <p className="text-sm font-medium text-slate-700">{f.product}</p>
            <p className="text-xs text-slate-400">{f.region}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#0066FF]">{f.forecast.toLocaleString()}</p>
            <p className="text-xs text-slate-400">
              [{f.lower.toLocaleString()}–{f.upper.toLocaleString()}]
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

function applySimulation(data, params) {
  const factor = 1 + (params.sensitivity - 50) / 100 * 0.6 + (params.volatility - 50) / 100 * 0.3;
  const threshold = params.threshold;
  return {
    ...data,
    anomalyTimeline: data.anomalyTimeline.map((d) => ({
      ...d,
      value: Math.round(d.value * factor),
      anomaly: d.value * factor > threshold,
    })),
    forecastData: data.forecastData.map((f) => ({
      ...f,
      forecast: Math.round(f.forecast * factor),
      lower: Math.round(f.lower * factor * 0.9),
      upper: Math.round(f.upper * factor * 1.1),
    })),
  };
}

export default function Beat3_DecisionHub() {
  const { activePersona } = usePersona();
  const baseData = useMemo(() => dataForPersona(activePersona), [activePersona]);
  const [params, setParams] = useState({ sensitivity: 50, volatility: 50, threshold: 150 });
  const [showToast, setShowToast] = useState(null);
  const [resolved, setResolved] = useState(new Set());

  const personaData = useMemo(() => applySimulation(baseData, params), [baseData, params]);
  const anomalyCount = personaData.anomalyTimeline.filter((d) => d.anomaly).length;

  const handleSlider = (key, value) => setParams((p) => ({ ...p, [key]: value }));

  const handleResolve = useCallback((id) => {
    setResolved((prev) => new Set([...prev, id]));
    setShowToast(id);
    setTimeout(() => setShowToast(null), 2500);
  }, []);

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
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">Decision Intelligence Hub</h1>
        <p className="text-slate-500">
          Actionable insights for <span className="font-medium text-slate-700">{activePersona.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-800">Anomaly Detection Trend</h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
              {anomalyCount} anomalies detected
            </span>
          </div>
          <AnomalyChart data={personaData.anomalyTimeline} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-800">Active Alerts</h2>
            </div>
            <span className="text-xs text-slate-400">{personaData.alerts.length} new</span>
          </div>
          <AlertsPanel alerts={personaData.alerts} onResolve={handleResolve} resolved={resolved} />
        </motion.div>
      </div>

      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Sliders className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-800">Simulation Parameter Control</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { key: "sensitivity", label: "Sensitivity", min: 10, max: 100, desc: "Anomaly detection sensitivity" },
              { key: "volatility", label: "Volatility", min: 10, max: 100, desc: "Market volatility factor" },
              { key: "threshold", label: "Threshold", min: 80, max: 300, desc: "Anomaly alert threshold" },
            ].map(({ key, label, min, max, desc }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">{label}</label>
                  <span className="text-xs font-semibold text-[#0066FF] bg-[#0066FF]/5 px-2 py-0.5 rounded-lg">{params[key]}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={params[key]}
                  onChange={(e) => handleSlider(key, Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-[#0066FF] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0066FF] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,102,255,0.3)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                />
                <p className="text-xs text-slate-400 mt-1">{desc}</p>
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
          className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-800">Demand Forecast</h2>
            </div>
          </div>
          <ForecastList data={personaData.forecastData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-800">LLM Recommendation</h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">
              Gemini AI
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="p-4 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#4F8CFF] text-white"
            >
              <Zap className="w-5 h-5 mb-2" />
              <p className="text-2xl font-bold">{personaData.stats.latencyReduction}%</p>
              <p className="text-xs text-white/80">Decision latency reduction</p>
            </motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 text-white"
            >
              <TrendingUp className="w-5 h-5 mb-2" />
              <p className="text-2xl font-bold">{personaData.stats.forecastGain}%</p>
              <p className="text-xs text-white/80">Forecast accuracy gain</p>
            </motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white"
            >
              <AlertTriangle className="w-5 h-5 mb-2" />
              <p className="text-2xl font-bold">{personaData.stats.resolvedAlerts}</p>
              <p className="text-xs text-white/80">Critical alerts resolved</p>
            </motion.div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {personaData.llmRecommendation}
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
