import { useState, useCallback } from "react";

const PROFILE_KEY = "decideintel_profile";

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return null;
}

function rng() {
  return String(1000 + Math.floor(Math.random() * 9000));
}

const defaults = (username) => ({
  name: username || "User",
  email: "",
  mobile: "",
  countryCode: "+91",
  emailVerified: false,
  mobileVerified: false,
  verifying: false,
  emailOtpSent: false,
  mobileOtpSent: false,
  emailOtpCode: "",
  mobileOtpCode: "",
  emailOtpTimer: 0,
  mobileOtpTimer: 0,
});

export default function useProfile() {
  const saved = loadProfile();
  const storedUsername = localStorage.getItem("username") || "User";
  const [profile, setProfile] = useState(saved || defaults(storedUsername));
  const [toast, setToast] = useState(null);

  const persist = (p) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    return p;
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const updateField = useCallback((field, value) => {
    setProfile((prev) => persist({ ...prev, [field]: value }));
  }, []);

  const sendEmailOtp = useCallback(() => {
    const code = rng();
    setProfile((prev) => persist({ ...prev, verifying: true, emailOtpCode: code }));
    setTimeout(() => {
      setProfile((prev) =>
        persist({ ...prev, verifying: false, emailOtpSent: true, emailOtpTimer: 60 })
      );
      showToast(`[DEMO MODE] Email Server Alert: Secure confirmation code sent to your inbox: ${code}`, "email");
      const timer = setInterval(() => {
        setProfile((prev) => {
          if (prev.emailOtpTimer <= 1) {
            clearInterval(timer);
            return persist({ ...prev, emailOtpTimer: 0 });
          }
          return persist({ ...prev, emailOtpTimer: prev.emailOtpTimer - 1 });
        });
      }, 1000);
    }, 1500);
  }, []);

  const sendMobileOtp = useCallback(() => {
    const code = rng();
    setProfile((prev) => persist({ ...prev, mobileOtpCode: code, mobileOtpSent: true, mobileOtpTimer: 60 }));
    showToast(`[DEMO MODE] SMS Gateway Alert: Your verification token is ${code}`, "mobile");
    const timer = setInterval(() => {
      setProfile((prev) => {
        if (prev.mobileOtpTimer <= 1) {
          clearInterval(timer);
          return persist({ ...prev, mobileOtpTimer: 0 });
        }
        return persist({ ...prev, mobileOtpTimer: prev.mobileOtpTimer - 1 });
      });
    }, 1000);
  }, []);

  const verifyEmailOtp = useCallback((code) => {
    setProfile((prev) => {
      if (code === prev.emailOtpCode) {
        return persist({ ...prev, emailVerified: true, emailOtpSent: false, emailOtpTimer: 0 });
      }
      return prev;
    });
  }, []);

  const verifyMobileOtp = useCallback((code) => {
    setProfile((prev) => {
      if (code === prev.mobileOtpCode) {
        return persist({ ...prev, mobileVerified: true, mobileOtpSent: false, mobileOtpTimer: 0 });
      }
      return prev;
    });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const profileComplete = profile.emailVerified && profile.mobileVerified;

  const countryCode = profile.countryCode || "+91";

  return {
    profile,
    updateField,
    sendEmailOtp,
    sendMobileOtp,
    verifyEmailOtp,
    verifyMobileOtp,
    profileComplete,
    toast,
    dismissToast,
    countryCode,
  };
}
