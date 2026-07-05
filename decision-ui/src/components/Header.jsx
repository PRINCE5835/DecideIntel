import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Loader2, Sparkles, LogOut, Settings, User, ChevronDown, Shield, CheckCircle2, Moon, Sun } from "lucide-react";
import { useDarkMode } from "../data/DarkModeContext";
import { usePersona, dataForPersona } from "../data/PersonaContext";
import { fetchWithRetry } from "../utils/retry";
import useProfile from "../data/useProfile";
import AccountSettings from "./AccountSettings";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

function sanitise(input) {
  return input.replace(/<[^>]*>/g, "").replace(/[<>"'`]/g, "").slice(0, 500);
}

export default function Header({ activeBeat, setActiveBeat, beats, onLogout }) {
  const { personas, activePersona, selectPersona } = usePersona();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const personaAlerts = useMemo(() => dataForPersona(activePersona).alerts || [], [activePersona]);
  const profileCtx = useProfile();
  const { profile, updateField, sendEmailOtp, sendMobileOtp, verifyEmailOtp, verifyMobileOtp, profileComplete, toast, dismissToast, countryCode } = profileCtx;
  const inputRef = useRef(null);
  const blurTimerRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredAlerts = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    const alerts = [];
    personas.forEach((p) => {
      const data = window.__personaData?.[p.id];
      data?.alerts?.forEach((a) => {
        if (a.message.toLowerCase().includes(q) || a.action.toLowerCase().includes(q)) {
          alerts.push({ ...a, persona: p.name });
        }
      });
    });
    const personaMatch = personas.filter((p) =>
      p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.bottleneck.toLowerCase().includes(q)
    );
    return { alerts, personas: personaMatch, raw: q };
  }, [query, personas]);

  const handleSubmit = useCallback(async () => {
    const raw = query.trim();
    if (!raw || loading) return;
    const question = sanitise(raw);
    setLoading(true);
    setAnswer(null);

    const localMatch = filteredAlerts;
    if (localMatch && (localMatch.alerts.length > 0 || localMatch.personas.length > 0)) {
      setTimeout(() => {
        const parts = [];
        if (localMatch.personas.length > 0) {
          parts.push(`**Matching Personas:** ${localMatch.personas.map((p) => p.name).join(", ")}`);
        }
        if (localMatch.alerts.length > 0) {
          parts.push(`**Matching Alerts:**\n${localMatch.alerts.map((a) => `- ${a.message} (${a.persona})`).join("\n")}`);
        }
        setAnswer({ answer: parts.join("\n\n"), source: "local" });
        setLoading(false);
      }, 600);
      return;
    }

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
  }, [query, loading, filteredAlerts]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleBlur = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => { if (!loading) setFocused(false); }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-card/90 backdrop-blur-xl border-b border-slate-200 dark:border-dark-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <div className="flex items-center gap-2 mr-4 flex-shrink-0">
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
              placeholder="Ask anything about your data... (e.g. 'show alerts')"
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
            {(answer || loading || (filteredAlerts && focused)) && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 max-h-80 overflow-y-auto"
              >
                {filteredAlerts && !loading && !answer && (
                  <div className="text-sm text-slate-500 space-y-2">
                    {filteredAlerts.personas.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Personas</p>
                        {filteredAlerts.personas.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { selectPersona(p.id); setFocused(false); }}
                            className="block w-full text-left p-2 rounded-lg hover:bg-slate-50 text-slate-700"
                          >
                            {p.name} — <span className="text-slate-400">{p.role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {filteredAlerts.alerts.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Alerts</p>
                        {filteredAlerts.alerts.map((a, i) => (
                          <p key={i} className="p-2 rounded-lg text-slate-600 text-xs">{a.message} <span className="text-slate-400">({a.persona})</span></p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-400">Press Enter or click Ask for full AI response</p>
                  </div>
                )}
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
                        {answer.source === "gemini" ? "Gemini AI" : answer.source === "local" ? "Local Intelligence" : "Decision Engine"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{answer.answer}</p>
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
                  : "text-slate-500 dark:text-dark-muted hover:text-slate-700 dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-border"
              }`}
            >
              <span className="mr-1.5">{beat.icon}</span>
              {beat.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2" ref={dropdownRef}>
          <button onClick={toggleDark} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-border transition-colors">
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-border transition-colors">
              <Bell className="w-5 h-5 text-slate-500" />
              {personaAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full -left-16 mt-2 w-80 bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-xl shadow-slate-200/50 p-3"
                >
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Active Alerts</p>
                  {personaAlerts.length === 0 ? (
                    <p className="text-sm text-slate-400 py-3 text-center">No alerts</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {personaAlerts.map((a) => (
                        <div key={a.id} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-dark-border/50">
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${a.severity === "CRITICAL" ? "bg-red-500" : a.severity === "WARNING" ? "bg-amber-500" : "bg-blue-500"}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-dark-text">{a.message}</p>
                            <p className="text-xs text-slate-400">{a.action} · {a.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-border rounded-xl py-1.5 pr-2 transition-colors group"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
              style={{ background: activePersona?.color || "#0066FF" }}
            >
              {activePersona?.initials || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-700 dark:text-dark-text leading-tight group-hover:text-[#0066FF] transition-colors">{profile.name}</p>
              <p className="text-xs text-slate-400 dark:text-dark-muted leading-tight">Platform Admin</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-dark-muted transition-transform ${showDropdown ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-xl shadow-slate-200/50 p-3"
              >
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#0066FF]/3 to-[#4F8CFF]/3 dark:from-[#0066FF]/10 dark:to-[#4F8CFF]/10 border border-[#0066FF]/8 mb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0066FF] to-[#4F8CFF] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {profile.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{profile.name}</p>
                      <p className="text-xs text-slate-400">{profile.email || "No email set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profileComplete ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Profile verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Shield className="w-3 h-3" />
                        Verification pending
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setShowDropdown(false); setShowAccountSettings(true); }}
                    className="w-full mt-2.5 h-9 flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm font-medium text-slate-600 dark:text-dark-muted hover:border-[#0066FF]/30 hover:text-[#0066FF] hover:shadow-sm transition-all"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Account Settings
                  </button>
                </div>

                <div className="px-3 py-1.5">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Switch Target Persona</p>
                </div>
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { selectPersona(p.id); setShowDropdown(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-sm transition-colors ${
                      activePersona.id === p.id ? "bg-[#0066FF]/5 text-[#0066FF]" : "text-slate-600 dark:text-dark-muted hover:bg-slate-50 dark:hover:bg-dark-border"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ background: p.color }}
                    >
                      {p.initials}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.role}</p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-dark-border mt-2 pt-2">
                  <button
                    onClick={() => { setShowDropdown(false); onLogout?.(); }}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {showAccountSettings && (
            <AccountSettings
              profile={profile}
              updateField={updateField}
              sendEmailOtp={sendEmailOtp}
              sendMobileOtp={sendMobileOtp}
              verifyEmailOtp={verifyEmailOtp}
              verifyMobileOtp={verifyMobileOtp}
              onClose={() => setShowAccountSettings(false)}
              toast={toast}
              dismissToast={dismissToast}
              countryCode={countryCode}
            />
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
