"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import clsx from "classnames";

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export function StreakBadge({ streak, className }: StreakBadgeProps) {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setPulseKey((prev) => prev + 1);
  }, [streak]);

  return (
    <motion.div
      key={pulseKey}
      className={clsx(
        "relative flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-brandBlue shadow",
        className
      )}
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 700, damping: 30 }}
      aria-live="polite"
    >
      <div className="relative">
        <motion.span
          className="absolute inset-0 rounded-full bg-accent/50"
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <Flame className="relative z-10 text-accent" size={20} />
      </div>
      <span>{streak} day streak</span>
    </motion.div>
  );
}
