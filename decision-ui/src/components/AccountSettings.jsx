import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, CheckCircle2, Loader2, Shield, Send, ChevronDown, Copy, XCircle } from "lucide-react";

const COUNTRIES = [
  { code: "+7", flag: "🇷🇺", label: "RU" },
  { code: "+1", flag: "🇺🇸", label: "US" },
  { code: "+33", flag: "🇫🇷", label: "FR" },
  { code: "+49", flag: "🇩🇪", label: "DE" },
  { code: "+44", flag: "🇬🇧", label: "UK" },
  { code: "+81", flag: "🇯🇵", label: "JP" },
  { code: "+86", flag: "🇨🇳", label: "CN" },
  { code: "+91", flag: "🇮🇳", label: "IN" },
  { code: "+971", flag: "🇦🇪", label: "AE" },
];

const DEFAULT_COUNTRY_INDEX = 7;

function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = useMemo(() => COUNTRIES.find((c) => c.code === value) || COUNTRIES[DEFAULT_COUNTRY_INDEX], [value]);
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 h-11 px-3 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm outline-none transition-all hover:border-slate-300 dark:hover:border-dark-muted"
      >
        <span className="text-base leading-none">{sel.flag}</span>
        <span className="text-xs font-medium text-slate-600 dark:text-dark-text">{sel.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 w-36 bg-white dark:bg-dark-card rounded-xl border border-slate-100 dark:border-dark-border shadow-lg py-1 max-h-56 overflow-y-auto">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-dark-border/50 ${
                  c.code === value ? "bg-[#0066FF]/5 text-[#0066FF]" : "text-slate-700 dark:text-dark-text"
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="font-medium">{c.code}</span>
                <span className="text-xs text-slate-400">{c.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
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
    <div className="flex gap-2 justify-center">
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
          className="w-10 h-12 text-center rounded-xl border border-slate-200 dark:border-dark-border text-lg font-semibold dark:text-dark-text outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12 disabled:opacity-40"
        />
      ))}
    </div>
  );
}

function ToastAlert({ toast, onDismiss }) {
  if (!toast) return null;
  const isEmail = toast.type === "email";
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-4 right-4 z-[60] max-w-sm w-full p-4 rounded-2xl border shadow-xl backdrop-blur-xl flex items-start gap-3"
      style={{
        background: isEmail
          ? "linear-gradient(135deg, #EFF6FF, #DBEAFE)"
          : "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
        borderColor: isEmail ? "#BFDBFE" : "#BBF7D0",
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: isEmail ? "#DBEAFE" : "#DCFCE7" }}
      >
        {isEmail ? (
          <Mail className="w-4 h-4 text-[#2563EB]" />
        ) : (
          <Phone className="w-4 h-4 text-[#16A34A]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          {isEmail ? "📧 Email Alert" : "📱 SMS Alert"}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-white/70"
            style={{ color: isEmail ? "#2563EB" : "#16A34A" }}>
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

export default function AccountSettings({
  profile,
  updateField,
  sendEmailOtp,
  sendMobileOtp,
  verifyEmailOtp,
  verifyMobileOtp,
  onClose,
  toast,
  dismissToast,
  countryCode,
}) {
  const [mobile, setMobile] = useState(() => {
    const raw = profile.mobile || "";
    return raw.startsWith("+") ? raw.replace(/^\+\d+\s*/, "") : raw;
  });

  const cc = countryCode || "+91";

  return (
    <>
      <AnimatePresence>
        <ToastAlert toast={toast} onDismiss={dismissToast} />
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-xl p-7 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-dark-text">Profile & Security</h2>
              <p className="text-sm text-slate-400 dark:text-dark-muted mt-0.5">Manage your account settings and verification</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-medium text-slate-400 dark:text-dark-muted uppercase tracking-wider mb-3">Profile Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm dark:text-dark-text outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5">Professional Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm dark:text-dark-text outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5">Mobile Number</label>
                  <div className="flex gap-2">
                    <CountrySelect value={cc} onChange={(v) => updateField("countryCode", v)} />
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => {
                          setMobile(e.target.value);
                          updateField("mobile", `${cc} ${e.target.value}`);
                        }}
                        className="w-full h-11 pl-10 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm dark:text-dark-text outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12"
                        placeholder="Enter mobile number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-dark-border pt-6">
              <h3 className="text-xs font-medium text-slate-400 dark:text-dark-muted uppercase tracking-wider mb-3">Verification Checkpoints</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-border/50 border border-slate-100 dark:border-dark-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-slate-400 dark:text-dark-muted" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-dark-text">Email Address</p>
                        <p className="text-xs text-slate-400 dark:text-dark-muted">{profile.email || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.emailVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : profile.verifying ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Sending...
                        </span>
                      ) : profile.emailOtpSent && profile.emailOtpTimer > 0 ? (
                        <span className="text-xs font-medium text-[#0066FF]">{profile.emailOtpTimer}s</span>
                      ) : profile.emailOtpSent && profile.emailOtpTimer === 0 ? (
                        <button
                          onClick={sendEmailOtp}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Resend
                        </button>
                      ) : (
                        <button
                          onClick={sendEmailOtp}
                          disabled={!profile.email.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Verify Email
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {profile.emailOtpSent && !profile.emailVerified && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 border-t border-slate-200 dark:border-dark-border mt-3">
                          <p className="text-xs text-slate-400 dark:text-dark-muted mb-2 text-center">
                            Enter the 4-digit code sent to your email
                          </p>
                          <OtpInput
                            length={4}
                            onComplete={verifyEmailOtp}
                            disabled={profile.emailVerified}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-border/50 border border-slate-100 dark:border-dark-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-slate-400 dark:text-dark-muted" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-dark-text">Mobile Number</p>
                        <p className="text-xs text-slate-400 dark:text-dark-muted">{profile.mobile || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.mobileVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : profile.mobileOtpSent && profile.mobileOtpTimer > 0 ? (
                        <span className="text-xs font-medium text-[#0066FF]">{profile.mobileOtpTimer}s</span>
                      ) : profile.mobileOtpSent && profile.mobileOtpTimer === 0 ? (
                        <button
                          onClick={sendMobileOtp}
                          disabled={!profile.mobile.trim() || profile.mobileVerified}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066FF]/5 text-[#0066FF] text-xs font-medium border border-[#0066FF]/10 hover:bg-[#0066FF]/10 transition-colors disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Resend
                        </button>
                      ) : (
                        <button
                          onClick={sendMobileOtp}
                          disabled={!profile.mobile.trim() || profile.mobileVerified}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066FF]/5 text-[#0066FF] text-xs font-medium border border-[#0066FF]/10 hover:bg-[#0066FF]/10 transition-colors disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send OTP
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {profile.mobileOtpSent && !profile.mobileVerified && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 border-t border-slate-200 dark:border-dark-border mt-3">
                          <p className="text-xs text-slate-400 dark:text-dark-muted mb-2 text-center">
                            Enter the 4-digit code sent to your mobile
                          </p>
                          <OtpInput
                            length={4}
                            onComplete={verifyMobileOtp}
                            disabled={profile.mobileVerified}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {profile.emailVerified && profile.mobileVerified && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">Profile fully verified. All pipeline operations are enabled.</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
