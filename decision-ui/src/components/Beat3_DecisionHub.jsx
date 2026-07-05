import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AlertTriangle, TrendingUp, Lightbulb, Zap } from "lucide-react";
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

const AlertsPanel = ({ alerts }) => {
  const [activeAlert, setActiveAlert] = useState(null);
  return (
    <div className="space-y-3">
      {alerts.map((alert, i) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          onMouseEnter={() => setActiveAlert(alert.id)}
          onMouseLeave={() => setActiveAlert(null)}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            activeAlert === alert.id ? "shadow-md border-slate-200" : "border-slate-100"
          } ${
            alert.severity === "CRITICAL"
              ? "bg-red-50/50"
              : alert.severity === "WARNING"
              ? "bg-amber-50/50"
              : "bg-slate-50"
          }`}
        >
          <div className="flex items-start gap-2">
            <div
              className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                alert.severity === "CRITICAL"
                  ? "bg-red-500"
                  : alert.severity === "WARNING"
                  ? "bg-amber-500"
                  : "bg-blue-500"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700">{alert.message}</p>
              <p className="text-xs text-slate-400 mt-0.5">{alert.action}</p>
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">{alert.time}</span>
          </div>
        </motion.div>
      ))}
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

export default function Beat3_DecisionHub() {
  const { activePersona } = usePersona();
  const personaData = useMemo(() => dataForPersona(activePersona), [activePersona]);
  const anomalyCount = personaData.anomalyTimeline.filter((d) => d.anomaly).length;

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
          <AlertsPanel alerts={personaData.alerts} />
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
    </motion.div>
  );
}
