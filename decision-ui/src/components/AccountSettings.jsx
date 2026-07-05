import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Mail, Phone, CheckCircle2, Loader2, Shield, Send, User } from "lucide-react";

function OtpInput({ length, onComplete }) {
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
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-10 h-12 text-center rounded-xl border border-slate-200 text-lg font-semibold outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12"
        />
      ))}
    </div>
  );
}

export default function AccountSettings({ profile, updateField, verifyEmail, sendOtp, verifyOtp, onClose }) {
  const [mobile, setMobile] = useState(profile.mobile || "");

  return (
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
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-xl p-7 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Profile & Security</h2>
            <p className="text-sm text-slate-400 mt-0.5">Manage your account settings and verification</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Profile Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Professional Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full h-11 pl-10 pr-32 rounded-xl bg-white border border-slate-200 text-sm outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value);
                      updateField("mobile", e.target.value);
                    }}
                    className="w-full h-11 pl-10 rounded-xl bg-white border border-slate-200 text-sm outline-none transition-all focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/12"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Verification Checkpoints</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Email Address</p>
                      <p className="text-xs text-slate-400">{profile.email || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.emailVerified ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : profile.verifying ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <button
                        onClick={verifyEmail}
                        disabled={!profile.email.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Verify Email
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Mobile Number</p>
                      <p className="text-xs text-slate-400">{profile.mobile || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.mobileVerified ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mobile Verified
                      </span>
                    ) : profile.otpSent && profile.otpTimer > 0 ? (
                      <span className="text-xs font-medium text-[#0066FF]">{profile.otpTimer}s</span>
                    ) : (
                      <button
                        onClick={sendOtp}
                        disabled={!profile.mobile.trim() || profile.mobileVerified}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066FF]/5 text-[#0066FF] text-xs font-medium border border-[#0066FF]/10 hover:bg-[#0066FF]/10 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send OTP
                      </button>
                    )}
                  </div>
                </div>
                {profile.otpSent && !profile.mobileVerified && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-400 mb-2 text-center">Enter the 4-digit code sent to your mobile</p>
                    <OtpInput length={4} onComplete={verifyOtp} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {profile.emailVerified && profile.mobileVerified && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">Profile fully verified. All pipeline operations are enabled.</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
