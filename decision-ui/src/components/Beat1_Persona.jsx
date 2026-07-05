import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Upload, FileJson, FileText, CheckCircle2 } from "lucide-react";
import { usePersona } from "../data/PersonaContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const itemLeft = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const itemRight = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Beat1_Persona({ onSelect }) {
  const { personas, activePersona, selectPersona, addPersona } = usePersona();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", bottleneck: "" });
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef(null);

  const parseFile = (file) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        if (file.name.endsWith(".json")) {
          setFileData(JSON.parse(text));
        } else {
          const lines = text.split("\n").filter(Boolean);
          const headers = lines[0].split(",").map((h) => h.trim());
          const rows = lines.slice(1).map((l) => {
            const vals = l.split(",").map((v) => v.trim());
            return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] }), {});
          });
          setFileData({ headers, rows, raw: text.slice(0, 2000) });
        }
      } catch {
        setFileData({ raw: e.target.result.slice(0, 2000) });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleAdd = () => {
    if (!form.name.trim() || !form.role.trim()) return;
    const p = addPersona({ ...form, fileData });
    selectPersona(p.id);
    onSelect?.(p);
    setShowModal(false);
    setForm({ name: "", role: "", bottleneck: "" });
    setFileData(null);
    setFileName("");
  };

  return (
    <motion.div
      key="persona"
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      className="pt-8"
    >
      <motion.div variants={item} className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0066FF]/5 border border-[#0066FF]/10 text-[#0066FF] text-sm font-medium mb-4"
        >
          <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
          AI-Powered Decision Intelligence Platform
        </motion.div>
        <h1 className="text-4xl font-bold text-slate-800 mb-3 tracking-tight">
          Choose Your Persona
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Select your role to see personalized intelligence insights and decision acceleration.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {personas.map((p, i) => (
          <motion.button
            key={p.id}
            variants={i === 0 ? itemLeft : i >= personas.length - 1 ? itemRight : item}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { selectPersona(p.id); onSelect?.(p); }}
            className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
              activePersona.id === p.id
                ? "border-[#0066FF] bg-white shadow-xl shadow-[#0066FF]/5"
                : "border-slate-100 bg-white hover:border-slate-200 shadow-sm hover:shadow-md"
            }`}
          >
            {activePersona.id === p.id && (
              <motion.div
                layoutId="activeBorder"
                className="absolute inset-0 rounded-2xl ring-2 ring-[#0066FF]/20"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4"
              style={{ background: p.color }}
            >
              {p.initials}
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{p.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{p.role}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-amber-700 mb-0.5">Decision Bottleneck</p>
              <p className="text-xs text-amber-600">{p.bottleneck}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">{p.stats.pipelines}</p>
                <p className="text-xs text-slate-400">Pipelines</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">{p.stats.decisions}</p>
                <p className="text-xs text-slate-400">Decisions</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-green-600">{p.stats.impact}</p>
                <p className="text-xs text-slate-400">Impact</p>
              </div>
            </div>
          </motion.button>
        ))}

        <motion.button
          variants={item}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="relative text-left p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 hover:border-[#0066FF]/40 hover:bg-[#0066FF]/3 transition-all flex flex-col items-center justify-center min-h-[280px]"
        >
          <div className="w-14 h-14 rounded-xl bg-[#0066FF]/5 border border-[#0066FF]/10 flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-[#0066FF]" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Add Custom Identity</h3>
          <p className="text-sm text-slate-400 text-center">Upload or create a new persona with custom data source</p>
        </motion.button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-7"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Add Custom Identity</h2>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12"
                    placeholder="e.g. Sarah Johnson"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12"
                    placeholder="e.g. Supply Chain Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Decision Bottleneck</label>
                  <input
                    type="text"
                    value={form.bottleneck}
                    onChange={(e) => setForm((f) => ({ ...f, bottleneck: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12"
                    placeholder="e.g. Inventory replenishment delay > 4h"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Data Source (CSV / JSON)</label>
                  <div
                    ref={dropRef}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative h-28 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer ${
                      dragOver ? "border-[#0066FF] bg-[#0066FF]/3" : fileData ? "border-green-200 bg-green-50/50" : "border-slate-200 bg-slate-50 hover:border-[#0066FF]/40"
                    }`}
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    {fileData ? (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">{fileName}</span>
                        <span className="text-green-500">loaded</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        {dragOver ? (
                          <Upload className="w-6 h-6 text-[#0066FF]" />
                        ) : (
                          <FileJson className="w-6 h-6 text-slate-300" />
                        )}
                        <p className="text-xs text-slate-400">
                          {dragOver ? "Drop file here" : "Drag & drop or click to browse"}
                        </p>
                        <p className="text-xs text-slate-300">Supports .csv, .json</p>
                      </div>
                    )}
                  </div>
                  <input id="file-input" type="file" accept=".json,.csv" onChange={handleFileInput} className="hidden" />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!form.name.trim() || !form.role.trim()}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#4F8CFF] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(0,102,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,102,255,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Create Persona
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
