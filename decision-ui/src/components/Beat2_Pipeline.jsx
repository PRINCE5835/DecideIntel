import { useState, useEffect, useMemo, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight, Shield, Terminal } from "lucide-react";
import { pipelineStages, benchmarkData } from "../data/mockData";
import { usePersona } from "../data/PersonaContext";
import useProfile from "../data/useProfile";

const stageDuration = 400;

const stageLogs = {
  ingest: [
    { t: 0, msg: "Ingesting data sources..." },
    { t: 80, msg: "  → Connected to 3 data streams" },
    { t: 160, msg: "  → Reading CSV: 12,847 rows received" },
    { t: 240, msg: "  → Reading JSON: 2 payloads parsed" },
    { t: 320, msg: "  → Total: 15.2 MB ingested in 0.34s" },
    { t: 400, msg: "✓ Ingest complete" },
  ],
  normalize: [
    { t: 0, msg: "Normalizing data schema..." },
    { t: 80, msg: "  → Standardizing column names" },
    { t: 160, msg: "  → Casting 8 fields to numeric" },
    { t: 240, msg: "  → Datetime alignment: 3 timezones merged" },
    { t: 320, msg: "  → 23 schema violations repaired" },
    { t: 400, msg: "✓ Normalize complete" },
  ],
  dedup: [
    { t: 0, msg: "Deduplicating records..." },
    { t: 80, msg: "  → Exact match scan on 12,847 rows" },
    { t: 160, msg: "  → Fuzzy matching with 0.95 threshold" },
    { t: 240, msg: "  → 156 duplicate rows removed" },
    { t: 320, msg: "  → 12,691 unique records remaining" },
    { t: 400, msg: "✓ Deduplicate complete" },
  ],
  filter: [
    { t: 0, msg: "Applying filter rules..." },
    { t: 80, msg: "  → Rule 1: Outlier removal (±3σ)" },
    { t: 160, msg: "  → Rule 2: Null value imputation (mean)" },
    { t: 240, msg: "  → Rule 3: Date range filter applied" },
    { t: 320, msg: "  → 341 outliers flagged, 89 nulls imputed" },
    { t: 400, msg: "✓ Filter complete" },
  ],
  analyze: [
    { t: 0, msg: "Running ML analysis..." },
    { t: 80, msg: "  → GPU kernel launched: 256 CUDA cores" },
    { t: 160, msg: "  → Anomaly detection: 0.03s (GPU)" },
    { t: 240, msg: "  → 2 anomalies detected at p<0.01" },
    { t: 320, msg: "  → Feature importance: 7/12 features selected" },
    { t: 400, msg: "✓ Analyze complete — results cached" },
  ],
  decide: [
    { t: 0, msg: "Generating decision recommendations..." },
    { t: 80, msg: "  → Gemini LLM inference (1.2s)" },
    { t: 160, msg: "  → 3 priority actions ranked" },
    { t: 240, msg: "  → Risk score computed: 0.23 (low)" },
    { t: 320, msg: "  → Decision report compiled" },
    { t: 400, msg: "✓ Decide complete — output ready" },
  ],
};

const BenchmarkRow = ({ data, index }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 600 + index * 300);
    return () => clearTimeout(t);
  }, [index]);

  const { cpuPct, gpuPct, speedup } = useMemo(() => {
    const maxVal = Math.max(data.cpu, data.gpu || 0.01) * 1.3;
    return {
      cpuPct: (data.cpu / maxVal) * 100,
      gpuPct: (data.gpu / maxVal) * 100,
      speedup: data.cpu && data.gpu ? (data.cpu / data.gpu).toFixed(1) : null,
    };
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{data.operation}</span>
        <span className="text-xs text-slate-400">{data.rows.toLocaleString()} rows</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400 w-8">CPU</span>
          <div className="flex-1 h-7 rounded-lg bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={animate ? { width: `${cpuPct}%` } : { width: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="h-full rounded-lg bg-[#0066FF]/20 flex items-center justify-end pr-2"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={animate ? { opacity: 1 } : { opacity: 0 }}
                className="text-xs font-medium text-[#0066FF]"
              >
                {data.cpu}s
              </motion.span>
            </motion.div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-green-600 w-8">GPU</span>
          <div className="flex-1 h-7 rounded-lg bg-green-50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={animate ? { width: `${gpuPct}%` } : { width: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-lg bg-green-500 flex items-center justify-end pr-2"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={animate ? { opacity: 1 } : { opacity: 0 }}
                className="text-xs font-medium text-white"
              >
                {data.gpu}s
              </motion.span>
            </motion.div>
          </div>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={animate ? { opacity: 1, x: 0 } : { opacity: 0 }}
            className="text-xs font-bold text-green-600 w-14 text-right"
          >
            {speedup ? `${speedup}x` : ""}
          </motion.span>
        </div>
      </div>
    </div>
  );
};

const BenchmarkRowMemo = memo(BenchmarkRow);

export default function Beat2_Pipeline({ onComplete }) {
  const { activePersona } = usePersona();
  const { profile, profileComplete } = useProfile();
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [stageStatuses, setStageStatuses] = useState(pipelineStages.map(() => "pending"));
  const [currentStage, setCurrentStage] = useState(-1);
  const [started, setStarted] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (currentStage < 0 || currentStage >= pipelineStages.length) return;
    const stage = pipelineStages[currentStage];
    const logs = stageLogs[stage.id] || [];
    if (!logs.length) return;
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < logs.length) {
        setTerminalLines((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${logs[idx].msg}`]);
        idx++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  }, [currentStage]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  useEffect(() => {
    if (!started || currentStage >= pipelineStages.length) return;
    const idx = currentStage + 1;
    const timer = setTimeout(() => {
      setCurrentStage(idx);
      setStageStatuses((prev) => {
        const next = [...prev];
        next[idx] = "running";
        if (idx > 0) next[idx - 1] = "done";
        return next;
      });
      if (idx === pipelineStages.length - 1) {
        setTimeout(() => {
          setStageStatuses((prev) => { const n = [...prev]; n[n.length - 1] = "done"; return n; });
          setShowBenchmarks(true);
          setTimeout(onComplete, 1200);
        }, stageDuration);
      }
    }, stageDuration + 200);
    return () => clearTimeout(timer);
  }, [started, currentStage, onComplete]);

  const handleRun = () => {
    if (started) return;
    if (!profileComplete) {
      setShowSecurityAlert(true);
      return;
    }
    setStarted(true);
    setCurrentStage(-1);
    setStageStatuses(pipelineStages.map(() => "pending"));
  };

  return (
    <motion.div
      key="pipeline"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="pt-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pipeline Build</h1>
          <p className="text-slate-500 mt-1">
            Running as <span className="font-medium text-slate-700">{activePersona.name}</span> —{" "}
            <span className="text-amber-600">{activePersona.bottleneck}</span>
          </p>
        </div>
        {!started && (
          <div className="flex flex-col items-end gap-2">
            {showSecurityAlert && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 max-w-xs"
              >
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-0.5">Profile verification required</p>
                    <p>Verify your email and mobile in Account Settings to run pipelines.</p>
                  </div>
                </div>
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRun}
              className="px-6 py-3 bg-[#0066FF] text-white rounded-xl font-semibold shadow-lg shadow-[#0066FF]/20 hover:shadow-xl hover:shadow-[#0066FF]/30 transition-shadow"
            >
              Run Pipeline
            </motion.button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between gap-2">
          {pipelineStages.map((stage, i) => (
            <div key={stage.id} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                animate={{
                  scale: stageStatuses[i] === "running" ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.6, repeat: stageStatuses[i] === "running" ? Infinity : 0 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all ${
                  stageStatuses[i] === "done"
                    ? "bg-green-50 text-green-600 border-2 border-green-200"
                    : stageStatuses[i] === "running"
                    ? "bg-[#0066FF]/10 text-[#0066FF] border-2 border-[#0066FF]/30 shadow-lg shadow-[#0066FF]/10"
                    : "bg-slate-50 text-slate-300 border-2 border-slate-100"
                }`}
              >
                {stageStatuses[i] === "done" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <span>{stage.icon}</span>
                )}
              </motion.div>
              <span
                className={`text-xs font-medium ${
                  stageStatuses[i] === "done"
                    ? "text-green-600"
                    : stageStatuses[i] === "running"
                    ? "text-[#0066FF]"
                    : "text-slate-400"
                }`}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {started && terminalLines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1E293B] rounded-2xl border border-slate-700 shadow-sm p-4 mb-6 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-[#34D399]" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pipeline Terminal</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-[#34D399]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                Running
              </span>
            </div>
            <div ref={terminalRef} className="h-44 overflow-y-auto space-y-0.5 font-mono text-xs scroll-smooth">
              {terminalLines.map((line, i) => (
                <div key={i} className={`${line.startsWith("✓") ? "text-[#34D399]" : "text-slate-300"} leading-6`}>
                  {line}
                </div>
              ))}
              {!showBenchmarks && (
                <span className="inline-block w-2 h-4 bg-slate-300 animate-pulse" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBenchmarks && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-xl font-bold text-slate-800">Acceleration Proof</h2>
              <span className="px-3 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                GPU Available
              </span>
            </div>

            <div className="space-y-5">
              {benchmarkData.map((b, i) => (
                <BenchmarkRowMemo key={b.operation} data={b} index={i} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100"
            >
              <p className="text-sm font-semibold text-green-700">
                GPU Acceleration: Pipeline completed in 1.6s — 94% faster than CPU baseline
              </p>
              <p className="text-xs text-green-600 mt-1">
                Decision latency reduced from &gt;4h to ~12min (95% improvement).
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
