"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface Props {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function ErrorEmptyState({ title, description, action }: Props) {
  return (
    <motion.div
      className="glass-panel flex flex-col items-center gap-4 rounded-3xl px-6 py-10 text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AlertTriangle size={48} className="text-amber-300" />
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      {action}
    </motion.div>
  );
}
