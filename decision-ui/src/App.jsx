import { useState, lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginPage from "./components/LoginPage";
import { personas } from "./data/mockData";

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

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [activeBeat, setActiveBeat] = useState("persona");
  const [selectedPersona, setSelectedPersona] = useState(personas[0]);
  const [pipelineDone, setPipelineDone] = useState(false);

  if (!token) {
    return <LoginPage onLogin={setToken} />;
  }

  const handlePersonaSelect = (p) => {
    setSelectedPersona(p);
    setActiveBeat("pipeline");
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8FAFC] font-['Inter']">
        <Header
          activeBeat={activeBeat}
          setActiveBeat={setActiveBeat}
          beats={beats}
          selectedPersona={selectedPersona}
        />
        <main className="max-w-7xl mx-auto px-6 pt-20 pb-12">
          <AnimatePresence mode="wait">
            <Suspense fallback={<BeatFallback />}>
              {activeBeat === "persona" && (
                <Beat1_Persona
                  key="persona"
                  personas={personas}
                  selected={selectedPersona}
                  onSelect={handlePersonaSelect}
                />
              )}
              {activeBeat === "pipeline" && (
                <Beat2_Pipeline
                  key="pipeline"
                  persona={selectedPersona}
                  onComplete={() => { setPipelineDone(true); setActiveBeat("decisions"); }}
                />
              )}
              {activeBeat === "decisions" && (
                <Beat3_DecisionHub
                  key="decisions"
                  persona={selectedPersona}
                />
              )}
            </Suspense>
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}
