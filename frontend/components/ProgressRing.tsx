"use client";

import { motion } from "framer-motion";
import clsx from "classnames";

const RADIUS = 64;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  progress: number;
  xp: number;
  level: number;
  threshold?: number;
  className?: string;
}

export function ProgressRing({
  progress,
  xp,
  level,
  threshold = 100,
  className
}: ProgressRingProps) {
  const normalized = Math.min(Math.max(progress, 0), 1);
  const dashOffset = CIRCUMFERENCE * (1 - normalized);

  return (
    <div className={clsx("relative flex items-center justify-center", className)}>
      <svg width="160" height="160" role="img" aria-label="XP progress ring">
        <circle
          cx="80"
          cy="80"
          r={RADIUS}
          fill="none"
          stroke="#e0f4ec"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <motion.circle
          cx="80"
          cy="80"
          r={RADIUS}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          style={{ strokeDasharray: CIRCUMFERENCE }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60d394" />
            <stop offset="100%" stopColor="#2bb673" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center text-center">
        <span className="text-xs font-semibold uppercase text-brandBlue">Lvl {level}</span>
        <span className="text-2xl font-black text-primary">{xp}</span>
        <span className="text-[11px] font-medium text-slate-500">of {threshold} XP</span>
      </div>
    </div>
  );
}
