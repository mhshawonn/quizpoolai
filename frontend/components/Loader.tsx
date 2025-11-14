"use client";

import { motion } from "framer-motion";

import { AnimatedMascot } from "./AnimatedMascot";

export function Loader({ label = "Generating quiz..." }: { label?: string }) {
  return (
    <div className="glass-panel flex flex-col items-center gap-4 rounded-3xl px-8 py-10 text-center text-slate-700">
      <AnimatedMascot mood="encourage" size={160} bubbleText="Analyzing transcript..." />
      <p className="text-base font-semibold text-primary">{label}</p>
      <div className="w-full rounded-full bg-slate-100 p-1">
        <motion.div
          className="h-3 rounded-full bg-gradient-to-r from-primary to-brandBlue"
          initial={{ width: "10%" }}
          animate={{ width: ["20%", "80%", "60%", "95%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p className="text-sm text-slate-500">
        Tip: keep this tab open. The mascot will chime when your quiz is ready.
      </p>
    </div>
  );
}
