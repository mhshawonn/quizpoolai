"use client";

import { motion } from "framer-motion";

const colors = ["#34d399", "#f472b6", "#fb7185", "#c084fc", "#facc15"];

export function AnimatedConfetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }).map((_, idx) => (
        <motion.span
          key={idx}
          className="absolute h-2 w-2 rounded-md"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[idx % colors.length]
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: [0, 80, -20], rotate: [0, 120, 360] }}
          transition={{ duration: 1.8, delay: idx * 0.05, repeat: Infinity }}
        />
      ))}
    </div>
  );
}
