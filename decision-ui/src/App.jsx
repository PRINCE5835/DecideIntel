import { useState, lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { DarkModeProvider } from "./data/DarkModeContext";
import { PersonaProvider } from "./data/PersonaContext";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";

const Beat1_Persona = lazy(() => import("./components/Beat1_Persona"));
const Beat2_Pipeline = lazy(() => import("./components/Beat2_Pipeline"));
const Beat3_DecisionHub = lazy(() => import("./components/Beat3_DecisionHub"));

const beats = [
  { id: "persona", label: "Identity & Data", icon: "👤" },
  { id: "pipeline", label: "Pipeline Build", icon: "⚡" },
  { id: "decisions", label: "Decision Output", icon: "🎯" },
];

function BeatFallback() {
  return (
    <div className="pt-8 flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}

function AuthenticatedApp({ onLogout }) {
  const [activeBeat, setActiveBeat] = useState("persona");
  const [pipelineDone, setPipelineDone] = useState(false);

  const handlePersonaSelect = () => {
    setActiveBeat("pipeline");
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-dark-bg font-['Inter'] transition-colors duration-200">
        <DarkModeProvider>
        <PersonaProvider>
          <Header
            activeBeat={activeBeat}
            setActiveBeat={setActiveBeat}
            beats={beats}
            onLogout={onLogout}
          />
          <main className="max-w-7xl mx-auto px-6 pt-20 pb-12">
            <AnimatePresence mode="wait">
              <Suspense fallback={<BeatFallback />}>
                {activeBeat === "persona" && (
                  <Beat1_Persona
                    key="persona"
                    onSelect={handlePersonaSelect}
                  />
                )}
                {activeBeat === "pipeline" && (
                  <Beat2_Pipeline
                    key="pipeline"
                    onComplete={() => { setPipelineDone(true); setActiveBeat("decisions"); }}
                  />
                )}
                {activeBeat === "decisions" && (
                  <Beat3_DecisionHub
                    key="decisions"
                  />
                )}
              </Suspense>
            </AnimatePresence>
          </main>
        </PersonaProvider>
        </DarkModeProvider>
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showSignup, setShowSignup] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
  };

  if (!token) {
    if (showSignup) {
      return <SignupPage onLogin={setToken} onSwitchToLogin={() => setShowSignup(false)} />;
    }
    return <LoginPage onLogin={setToken} onSwitchToSignup={() => setShowSignup(true)} />;
  }

  return <AuthenticatedApp onLogout={handleLogout} />;
}
