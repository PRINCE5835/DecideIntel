import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { fetchWithRetry } from "../utils/retry";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

function LogoD() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 drop-shadow-lg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <filter id="logoGlow">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#0066FF" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#logoGlow)">
        <rect x="14" y="10" width="6" height="44" rx="3" fill="url(#logoGrad)" />
        <path d="M20 10 C36 10, 46 19, 46 32 C46 45, 36 54, 20 54" stroke="url(#logoGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>

      <path d="M20 16 L34 16 L40 26 L40 38 L34 48 L20 48" stroke="url(#logoGrad)" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.45" fill="none" />
      <path d="M20 32 L34 16" stroke="url(#logoGrad)" strokeWidth="0.5" strokeDasharray="1.5 3" opacity="0.3" fill="none" />
      <path d="M20 32 L40 26" stroke="url(#logoGrad)" strokeWidth="0.5" strokeDasharray="1.5 3" opacity="0.3" fill="none" />
      <path d="M20 32 L40 38" stroke="url(#logoGrad)" strokeWidth="0.5" strokeDasharray="1.5 3" opacity="0.3" fill="none" />
      <path d="M20 32 L34 48" stroke="url(#logoGrad)" strokeWidth="0.5" strokeDasharray="1.5 3" opacity="0.3" fill="none" />
      <path d="M34 16 L40 38" stroke="url(#logoGrad)" strokeWidth="0.4" strokeDasharray="1 4" opacity="0.2" fill="none" />
      <path d="M40 26 L34 48" stroke="url(#logoGrad)" strokeWidth="0.4" strokeDasharray="1 4" opacity="0.2" fill="none" />

      <circle cx="20" cy="16" r="2.5" fill="#0066FF"><animate attributeName="r" values="2;3;2" dur="3s" repeatCount="indefinite" /></circle>
      <circle cx="34" cy="16" r="2" fill="#34D399"><animate attributeName="r" values="2;3;2" dur="2.5s" repeatCount="indefinite" /></circle>
      <circle cx="40" cy="26" r="2.5" fill="#0066FF"><animate attributeName="r" values="2.5;3.5;2.5" dur="2.8s" repeatCount="indefinite" /></circle>
      <circle cx="40" cy="38" r="2" fill="#34D399"><animate attributeName="r" values="2;3;2" dur="3.2s" repeatCount="indefinite" /></circle>
      <circle cx="34" cy="48" r="2.5" fill="#0066FF"><animate attributeName="r" values="2;3;2" dur="2.6s" repeatCount="indefinite" /></circle>
      <circle cx="20" cy="48" r="2" fill="#34D399"><animate attributeName="r" values="2;3;2" dur="3.5s" repeatCount="indefinite" /></circle>
      <circle cx="20" cy="32" r="2" fill="#0066FF"><animate attributeName="r" values="2;3;2" dur="2.2s" repeatCount="indefinite" /></circle>
    </svg>
  );
}

export default function LoginPage({ onLogin, onSwitchToSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ status: "checking", msg: "", detail: "" });

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const check = () => {
      if (cancelled || retries >= 6) return;
      retries++;
      setBackendStatus({ status: "checking", msg: `Trying... (attempt ${retries}/6)`, detail: "" });
      fetch(`${API_BASE}/auth/health`, { signal: AbortSignal.timeout(30000) })
        .then((r) => r.json())
        .then((d) => { if (!cancelled) setBackendStatus({ status: d?.status === "ok" ? "online" : "error", msg: d?.status === "ok" ? "Server connected" : "Backend error", detail: JSON.stringify(d ?? {}) }); })
        .catch((err) => {
          if (!cancelled) {
            const msg = err?.message || "Unknown error";
            const detail = `URL: ${API_BASE}/auth/health`;
            setBackendStatus({ status: "offline", msg: "Cannot reach the server", detail: `${msg} — ${detail}` });
            setTimeout(check, 8000);
          }
        });
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError("");
    try {
      const resp = await fetchWithRetry(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.message || "Login failed");
      }
      const data = await resp.json().catch(() => null);
      if (!data?.token) throw new Error("Invalid server response — no token received");
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data?.username || "");
      onLogin(data.token);
    } catch (err) {
      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        setError("Cannot reach the server. Make sure the backend is running.");
      } else if (err?.message?.includes("timed out") || err?.name === "AbortError") {
        setError("Request timed out. Backend may be starting up — try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F9F9F9] dark:bg-dark-bg flex items-center justify-center p-4 overflow-hidden transition-colors duration-200">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0066FF]/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#34D399]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl rounded-3xl border border-slate-100/60 dark:border-dark-border/60 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-10">
          <div className="text-center mb-9">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center mb-5"
            >
              <LogoD />
            </motion.div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-dark-text tracking-tight">Decision Intelligence Hub</h1>
            <p className="text-sm text-slate-400 dark:text-dark-muted mt-1.5 font-normal">Sign in to your account</p>
            <div className="mt-4 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${backendStatus.status === "online" ? "bg-green-500" : backendStatus.status === "checking" ? "bg-amber-400 animate-pulse" : "bg-red-400"}`} />
                <span className="text-xs text-slate-400">{backendStatus?.msg ?? ""}</span>
              </div>
              {backendStatus.status === "offline" && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 text-left w-full">
                  <p className="font-medium mb-1">Diagnostics:</p>
                  <p className="break-all">{backendStatus.detail}</p>
                  <p className="mt-2">
                    Open{" "}
                    <a href={`${API_BASE}/auth/health`} target="_blank" rel="noopener noreferrer" className="text-red-600 underline">backend health check</a> in a new tab
                  </p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm text-slate-800 dark:text-dark-text placeholder:text-slate-400 dark:placeholder:text-dark-muted outline-none transition-all duration-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12 focus:shadow-[0_0_0_4px_rgba(0,102,255,0.06)]"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm text-slate-800 dark:text-dark-text placeholder:text-slate-400 dark:placeholder:text-dark-muted outline-none transition-all duration-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12 focus:shadow-[0_0_0_4px_rgba(0,102,255,0.06)] pr-11"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <button type="button" className="text-xs text-[#0066FF] hover:text-[#0052CC] font-medium transition-colors">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3.5 rounded-xl">
                <p>{error}</p>
                {error === "Cannot reach the server. Make sure the backend is running." && (
                  <a href={`${API_BASE}/auth/health`} target="_blank" rel="noopener noreferrer" className="block mt-1.5 text-red-500 underline text-xs">
                    Open API health check directly &rarr;
                  </a>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0066FF] to-[#4F8CFF] text-white text-sm font-semibold rounded-xl shadow-[0_4px_14px_rgba(0,102,255,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,102,255,0.3)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_14px_rgba(0,102,255,0.25)]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              )}
              {loading ? "Signing in\u2026" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={onSwitchToSignup}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0066FF] font-medium transition-colors group"
            >
              <span className="w-0 group-hover:w-4 h-px bg-[#0066FF] transition-all duration-300" />
              Don't have an account? <span className="text-[#0066FF]">Sign up</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
