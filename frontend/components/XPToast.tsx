"use client";

import { AnimatePresence, motion } from "framer-motion";

interface XPToastProps {
  amount: number;
  isVisible: boolean;
  label?: string;
}

export function XPToast({ amount, isVisible, label = "XP!" }: XPToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-30 flex justify-center">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 700, damping: 30 }}
            className="xp-chip px-4 py-2 text-base shadow-xl"
            aria-live="polite"
          >
            +{amount} {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
