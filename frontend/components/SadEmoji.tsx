"use client";

import { motion } from "framer-motion";

export function SadEmoji() {
  return (
    <motion.div
      className="mt-4 text-4xl"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: [1, 0.9, 1], opacity: 1, rotate: [-5, 5, -5] }}
      transition={{ duration: 1.2, repeat: Infinity }}
    >
      😢
    </motion.div>
  );
}
