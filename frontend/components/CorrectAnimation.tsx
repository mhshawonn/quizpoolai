"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { AnimatedMascot } from "./AnimatedMascot";

interface CorrectAnimationProps {
  explanation: string;
}

export function CorrectAnimation({ explanation }: CorrectAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 10 }}
      transition={{ type: "spring", stiffness: 700, damping: 30 }}
      className="rounded-3xl bg-white p-5 text-center shadow-xl"
    >
      <div className="flex flex-col items-center gap-3">
        <AnimatedMascot mood="celebrate" size={120} bubbleText="Correct!" />
        <div className="xp-chip text-base text-slate-800">+10 XP</div>
        <p className="text-sm text-slate-600">{explanation}</p>
        <p className="text-xs uppercase tracking-widest text-primary flex items-center justify-center gap-1 font-semibold">
          <Sparkles size={14} /> Keep going!
        </p>
      </div>
    </motion.div>
  );
}
