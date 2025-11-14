"use client";

import { motion } from "framer-motion";

export function GiftBox() {
  return (
    <motion.div
      className="mt-4 flex items-center justify-center"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 12 }}
    >
      <motion.div
        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 shadow-2xl"
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-full w-full rounded-2xl border-2 border-white/70" />
      </motion.div>
    </motion.div>
  );
}
