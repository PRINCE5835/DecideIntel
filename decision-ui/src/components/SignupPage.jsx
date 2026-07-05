import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, User, Lock, Shield, CheckCircle2, XCircle, Sparkles } from "lucide-react";

const TAKEN_USERNAMES = new Set(["admin", "user1", "maya", "root", "test", "demo", "system", "superuser", "null", "undefined", "api", "support"]);

function LogoD() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 drop-shadow-lg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <filter id="glow">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#0066FF" floodOpacity="0.2" />
        </filter>
      </defs>
      <g filter="url(#glow)">
        <rect x="14" y="10" width="6" height="44" rx="3" fill="url(#g)" />
        <path d="M20 10 C36 10, 46 19, 46 32 C46 45, 36 54, 20 54" stroke="url(#g)" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>
      <path d="M20 16 L34 16 L40 26 L40 38 L34 48 L20 48" stroke="url(#g)" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.4" fill="none" />
      <circle cx="20" cy="16" r="2" fill="#0066FF"><animate attributeName="r" values="2;3;2" dur="3s" repeatCount="indefinite" /></circle>
      <circle cx="34" cy="16" r="1.8" fill="#34D399"><animate attributeName="r" values="1.8;2.8;1.8" dur="2.5s" repeatCount="indefinite" /></circle>
      <circle cx="40" cy="26" r="2" fill="#0066FF"><animate attributeName="r" values="2;3;2" dur="2.8s" repeatCount="indefinite" /></circle>
      <circle cx="40" cy="38" r="1.8" fill="#34D399"><animate attributeName="r" values="1.8;2.8;1.8" dur="3.2s" repeatCount="indefinite" /></circle>
      <circle cx="34" cy="48" r="2" fill="#0066FF"><animate attributeName="r" values="2;3;2" dur="2.6s" repeatCount="indefinite" /></circle>
      <circle cx="20" cy="48" r="1.8" fill="#34D399"><animate attributeName="r" values="1.8;2.8;1.8" dur="3.5s" repeatCount="indefinite" /></circle>
    </svg>
  );
}

function OtpInput({ length, onComplete, disabled }) {
  const [vals, setVals] = useState(Array(length).fill(""));
  const refs = useRef([]);
  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...vals];
    next[i] = v;
    setVals(next);
    if (v && i < length - 1) refs.current[i + 1]?.focus();
    const code = next.join("");
    if (code.length === length) onComplete(code);
  };
  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !vals[i] && i > 0) refs.current[i - 1]?.focus();
  };
  return (
    <div className="flex gap-2.5 justify-center">
      {vals.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          maxLength={1}
          value={v}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-12 h-14 text-center rounded-xl border-2 border-slate-200 dark:border-dark-border text-xl font-bold dark:text-dark-text outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12 disabled:opacity-40"
        />
      ))}
    </div>
  );
}

function ToastAlert({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-4 right-4 z-[60] max-w-sm w-full p-4 rounded-2xl border shadow-xl backdrop-blur-xl flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
        borderColor: "#BFDBFE",
      }}
    >
      <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Mail className="w-4 h-4 text-[#2563EB]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          📧 Activation Gateway
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-white/70 text-[#2563EB]">
            Demo
          </span>
        </p>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{toast.message}</p>
      </div>
      <button onClick={onDismiss} className="p-0.5 rounded hover:bg-white/50 transition-colors flex-shrink-0">
        <XCircle className="w-4 h-4 text-slate-400" />
      </button>
    </motion.div>
  );
}

function rng() {
  return String(1000 + Math.floor(Math.random() * 9000));
}

export default function SignupPage({ onLogin, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(null); // null | "checking" | "available" | "taken"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [toast, setToast] = useState(null);
  const usernameTimer = useRef(null);

  const showToast = (msg) => {
    setToast({ message: msg });
    setTimeout(() => setToast(null), 6000);
  };

  const checkUsername = useCallback((val) => {
    const v = val.trim().toLowerCase();
    if (!v) { setUsernameStatus(null); return; }
    setUsernameStatus("checking");
    clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(() => {
      const taken = TAKEN_USERNAMES.has(v);
      setUsernameStatus(taken ? "taken" : "available");
    }, 400);
  }, []);

  const handleUsernameChange = (e) => {
    const v = e.target.value.replace(/\s/g, "");
    setUsername(v);
    checkUsername(v);
  };

  const suggestUsername = () => {
    if (!name.trim()) return;
    const base = name.trim().toLowerCase().replace(/\s+/g, "");
    const suffix = String(Math.floor(100 + Math.random() * 900));
    const suggestion = base + suffix;
    setUsername(suggestion);
    checkUsername(suggestion);
  };

  const handleGenerateToken = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }
    if (usernameStatus === "taken") {
      setError("Please choose a different username.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setError("");
    setLoading(true);
    const code = rng();
    setTimeout(() => {
      setOtpCode(code);
      setOtpSent(true);
      setLoading(false);
      showToast(`[DEMO MODE] Activation Gateway: Your secure email registration code is ${code}.`);
    }, 1500);
  };

  const handleOtpComplete = useCallback((entered) => {
    if (entered === otpCode) {
      setOtpVerified(true);
      const mockToken = "mock-token-" + Date.now();
      localStorage.setItem("token", mockToken);
      localStorage.setItem("username", username);
      localStorage.setItem(
        "decideintel_profile",
        JSON.stringify({
          name,
          email,
          mobile: "",
          countryCode: "+91",
          emailVerified: true,
          mobileVerified: false,
          emailOtpSent: false,
          mobileOtpSent: false,
          emailOtpCode: "",
          mobileOtpCode: "",
          emailOtpTimer: 0,
          mobileOtpTimer: 0,
        })
      );
      setTimeout(() => onLogin(mockToken), 800);
    } else {
      setError("Incorrect code. Please check the toast for the correct token.");
    }
  }, [otpCode, name, email, onLogin]);

  return (
    <>
      <AnimatePresence>
        <ToastAlert toast={toast} onDismiss={() => setToast(null)} />
      </AnimatePresence>

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
              <h1 className="text-xl font-semibold text-slate-800 dark:text-dark-text tracking-tight">Create your account</h1>
              <p className="text-sm text-slate-400 dark:text-dark-muted mt-1.5 font-normal">Join Decision Intelligence Hub</p>
            </div>

            <AnimatePresence mode="wait">
              {otpVerified ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-dark-text mb-1">Account Verified</h2>
                  <p className="text-sm text-slate-400 dark:text-dark-muted">Redirecting to your dashboard...</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={otpSent}
                          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm dark:text-dark-text placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12 focus:shadow-[0_0_0_4px_rgba(0,102,255,0.06)] disabled:opacity-50"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5">Username</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={username}
                          onChange={handleUsernameChange}
                          disabled={otpSent}
                          className="w-full h-11 pl-10 pr-20 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm dark:text-dark-text placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12 focus:shadow-[0_0_0_4px_rgba(0,102,255,0.06)] disabled:opacity-50"
                          placeholder="Choose a username"
                        />
                        <button
                          type="button"
                          onClick={suggestUsername}
                          disabled={otpSent}
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[#0066FF] bg-[#0066FF]/8 hover:bg-[#0066FF]/14 transition-colors disabled:opacity-40"
                        >
                          <Sparkles className="w-3 h-3" />
                          Suggest
                        </button>
                      </div>
                      {usernameStatus === "checking" && (
                        <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                        </p>
                      )}
                      {usernameStatus === "taken" && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Username already exists.
                        </p>
                      )}
                      {usernameStatus === "available" && (
                        <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Username available
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5">Professional Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={otpSent}
                          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm dark:text-dark-text placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12 focus:shadow-[0_0_0_4px_rgba(0,102,255,0.06)] disabled:opacity-50"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={otpSent}
                          className="w-full h-11 pl-10 pr-11 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm dark:text-dark-text placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12 focus:shadow-[0_0_0_4px_rgba(0,102,255,0.06)] disabled:opacity-50"
                          placeholder="At least 4 characters"
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

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-600 bg-red-50 border border-red-200 p-3.5 rounded-xl"
                      >
                        <p>{error}</p>
                      </motion.div>
                    )}

                    {!otpSent ? (
                      <button
                        onClick={handleGenerateToken}
                        disabled={loading || usernameStatus === "taken" || !username.trim()}
                        className="relative w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0066FF] to-[#4F8CFF] text-white text-sm font-semibold rounded-xl shadow-[0_4px_14px_rgba(0,102,255,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,102,255,0.3)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                        {loading ? "Generating Token..." : "Generate Verification Token"}
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3"
                      >
                        <div className="pt-2">
                          <p className="text-xs text-slate-400 dark:text-dark-muted text-center mb-3">
                            A 4-digit code was sent to <span className="font-medium text-slate-600 dark:text-dark-text">{email}</span>
                          </p>
                          <OtpInput length={4} onComplete={handleOtpComplete} />
                          <p className="text-xs text-slate-400 dark:text-dark-muted text-center mt-3">
                            Check the toast notification at the top-right corner for the code
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!otpSent && !otpVerified && (
              <div className="mt-8 text-center">
                <button
                  onClick={onSwitchToLogin}
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0066FF] font-medium transition-colors group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  Already have an account? <span className="text-[#0066FF]">Sign in</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
