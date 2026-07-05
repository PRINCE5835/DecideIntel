import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Loader2, LogIn } from "lucide-react";
import { fetchWithRetry } from "../utils/retry";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function SignupPage({ onLogin, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const resp = await fetchWithRetry(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.message || "Signup failed");
      }
      const data = await resp.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
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
            <p className="text-sm text-slate-500 mt-1">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10"
                placeholder="At least 4 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10"
                placeholder="Re-enter password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 bg-[#0066FF] text-white rounded-xl font-semibold hover:bg-[#0052CC] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Sign Up
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToLogin}
              className="inline-flex items-center gap-1.5 text-sm text-[#0066FF] hover:text-[#0052CC] font-medium transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}