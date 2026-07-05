import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Loader2, Sparkles } from "lucide-react";
import { fetchWithRetry } from "../utils/retry";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

function sanitise(input) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"'`]/g, "")
    .slice(0, 500);
}

export default function Header({ activeBeat, setActiveBeat, beats, selectedPersona }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const blurTimerRef = useRef(null);

  const handleSubmit = useCallback(async () => {
    const raw = query.trim();
    if (!raw || loading) return;
    const question = sanitise(raw);
    setLoading(true);
    setAnswer(null);
    try {
      const resp = await fetchWithRetry(`${API_BASE}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ question }),
      });
      if (!resp.ok) throw new Error(`Query failed: ${resp.status}`);
      const data = await resp.json();
      setAnswer(data);
    } catch {
      setAnswer({ answer: "Unable to reach the decision engine. Ensure the backend server is running.", source: "error" });
    } finally {
      setLoading(false);
    }
  }, [query, loading]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleBlur = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => { if (!loading) setFocused(false); }, 200);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#4F8CFF] flex items-center justify-center text-white text-sm font-bold">
            D
          </div>
          <span className="font-semibold text-slate-800 text-lg tracking-tight">
            Decide<span className="text-[#0066FF]">Intel</span>
          </span>
        </div>

        <div className="flex-1 max-w-2xl relative">
          <motion.div
            animate={{ scale: focused ? 1.02 : 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your data... (e.g. 'what anomalies were found?')"
              className="w-full h-10 pl-10 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10 transition-all"
            />
            {query.trim() && !loading && (
              <button
                onClick={handleSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0066FF] text-white text-xs font-medium hover:bg-[#0052CC] transition-colors"
              >
                Ask
              </button>
            )}
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF] animate-spin" />
            )}
          </motion.div>

          <AnimatePresence>
            {(answer || loading) && focused && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50"
              >
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Querying decision engine...
                  </div>
                )}
                {answer && !loading && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        {answer.source === "gemini" ? "Gemini AI" : "Decision Engine"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{answer.answer}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {beats.map((beat) => (
            <button
              key={beat.id}
              onClick={() => setActiveBeat(beat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeBeat === beat.id
                  ? "bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/20"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="mr-1.5">{beat.icon}</span>
              {beat.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <Bell className="w-5 h-5 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ background: selectedPersona?.color || "#0066FF" }}
            >
              {selectedPersona?.initials || "U"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700 leading-tight">{selectedPersona?.name}</p>
              <p className="text-xs text-slate-400 leading-tight">{selectedPersona?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
