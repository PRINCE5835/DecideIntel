import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogIn, Loader2, UserPlus, WifiOff } from "lucide-react";
import { fetchWithRetry } from "../utils/retry";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function LoginPage({ onLogin, onSwitchToSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        .then((d) => { if (!cancelled) setBackendStatus({ status: d.status === "ok" ? "online" : "error", msg: d.status === "ok" ? "Server connected" : "Backend error", detail: JSON.stringify(d) }); })
        .catch((err) => {
          if (!cancelled) {
            const msg = err.message || "Unknown error";
            const detail = `URL: ${API_BASE}/auth/health`;
            setBackendStatus({ status: "offline", msg: `Cannot reach the server`, detail: `${msg} — ${detail}` });
            console.error("Health check failed:", msg, detail);
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
        const data = await resp.json();
        throw new Error(data.message || "Login failed");
      }
      const data = await resp.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      onLogin(data.token);
    } catch (err) {
      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        setError("Cannot reach the server. Make sure the backend is running.");
      } else if (err.message?.includes("timed out") || err.name === "AbortError") {
        setError("Request timed out. Backend may be starting up — try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#4F8CFF] flex items-center justify-center text-white text-xl font-bold">
              D
            </div>
            <h1 className="text-2xl font-bold text-slate-800">DecideIntel</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to continue</p>
            <div className="mt-3 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${backendStatus.status === "online" ? "bg-green-500" : backendStatus.status === "checking" ? "bg-amber-400 animate-pulse" : "bg-red-400"}`} />
                <span className="text-xs text-slate-400">{backendStatus.msg}</span>
              </div>
              {backendStatus.status === "offline" && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 text-left w-full">
                  <p className="font-medium mb-1">Diagnostics:</p>
                  <p className="break-all">{backendStatus.detail}</p>
                  <p className="mt-2">
                    Open{" "}
                    <a href={`${API_BASE}/auth/health`} target="_blank" rel="noopener noreferrer"
                       className="text-red-600 underline">backend health check</a> in a new tab
                  </p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
                <p>{error}</p>
                {error === "Cannot reach the server. Make sure the backend is running." && (
                  <a href={`${API_BASE}/auth/health`} target="_blank" rel="noopener noreferrer"
                     className="block mt-1.5 text-red-500 underline text-xs">
                    Open API health check directly &rarr;
                  </a>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 bg-[#0066FF] text-white rounded-xl font-semibold hover:bg-[#0052CC] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToSignup}
              className="inline-flex items-center gap-1.5 text-sm text-[#0066FF] hover:text-[#0052CC] font-medium transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
