import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const itemLeft = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const itemRight = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Beat1_Persona({ personas, selected, onSelect }) {
  return (
    <motion.div
      key="persona"
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      className="pt-8"
    >
      {/* Hero */}
      <motion.div variants={item} className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0066FF]/5 border border-[#0066FF]/10 text-[#0066FF] text-sm font-medium mb-4"
        >
          <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
          AI-Powered Decision Intelligence Platform
        </motion.div>
        <h1 className="text-4xl font-bold text-slate-800 mb-3 tracking-tight">
          Choose Your Persona
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Select your role to see personalized intelligence insights and decision acceleration.
        </p>
      </motion.div>

      {/* Persona Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {personas.map((p, i) => (
          <motion.button
            key={p.id}
            variants={i === 0 ? itemLeft : i === 2 ? itemRight : item}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(p)}
            className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
              selected.id === p.id
                ? "border-[#0066FF] bg-white shadow-xl shadow-[#0066FF]/5"
                : "border-slate-100 bg-white hover:border-slate-200 shadow-sm hover:shadow-md"
            }`}
          >
            {selected.id === p.id && (
              <motion.div
                layoutId="activeBorder"
                className="absolute inset-0 rounded-2xl ring-2 ring-[#0066FF]/20"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4"
              style={{ background: p.color }}
            >
              {p.initials}
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{p.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{p.role}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-amber-700 mb-0.5">Decision Bottleneck</p>
              <p className="text-xs text-amber-600">{p.bottleneck}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">{p.stats.pipelines}</p>
                <p className="text-xs text-slate-400">Pipelines</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">{p.stats.decisions}</p>
                <p className="text-xs text-slate-400">Decisions</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-green-600">{p.stats.impact}</p>
                <p className="text-xs text-slate-400">Impact</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
