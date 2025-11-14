"use client";

import { motion } from "framer-motion";

interface Props {
  progress: number; // 0-1
}

export function ProgressBar({ progress }: Props) {
  return (
    <div className="h-3 w-full rounded-full bg-white/10">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-fuchsia-400 to-orange-400"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}
