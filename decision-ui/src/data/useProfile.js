import { useState, useCallback } from "react";

const PROFILE_KEY = "decideintel_profile";

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

const defaults = (username) => ({
  name: username || "User",
  email: "",
  mobile: "",
  emailVerified: false,
  mobileVerified: false,
  verifying: false,
  otpSent: false,
  otpCode: "",
  otpTimer: 0,
});

export default function useProfile() {
  const saved = loadProfile();
  const storedUsername = localStorage.getItem("username") || "User";
  const [profile, setProfile] = useState(saved || defaults(storedUsername));

  const persist = (p) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    return p;
  };

  const updateField = useCallback((field, value) => {
    setProfile((prev) => persist({ ...prev, [field]: value }));
  }, []);

  const verifyEmail = useCallback(() => {
    setProfile((prev) => persist({ ...prev, verifying: true }));
    setTimeout(() => {
      setProfile((prev) => persist({ ...prev, verifying: false, emailVerified: true, email: prev.email || "user@example.com" }));
    }, 1800);
  }, []);

  const sendOtp = useCallback(() => {
    setProfile((prev) => persist({ ...prev, otpSent: true, otpTimer: 60 }));
    const timer = setInterval(() => {
      setProfile((prev) => {
        if (prev.otpTimer <= 1) {
          clearInterval(timer);
          return persist({ ...prev, otpTimer: 0 });
        }
        return persist({ ...prev, otpTimer: prev.otpTimer - 1 });
      });
    }, 1000);
  }, []);

  const verifyOtp = useCallback((code) => {
    if (code.length === 4) {
      setProfile((prev) => persist({ ...prev, otpCode: code, mobileVerified: true, otpTimer: 0 }));
    }
  }, []);

  const profileComplete = profile.emailVerified && profile.mobileVerified;

  return { profile, updateField, verifyEmail, sendOtp, verifyOtp, profileComplete };
}
