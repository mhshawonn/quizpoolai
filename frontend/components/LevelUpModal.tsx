"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { CoinShower } from "./CoinShower";

interface LevelUpModalProps {
  isOpen: boolean;
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ isOpen, level, onClose }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <CoinShower trigger={level} duration={2200} />
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 700, damping: 30 }}
          >
            <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brandBlue text-white shadow-xl">
                <span className="text-4xl font-black">Lv{level}</span>
              </div>
              <h2 className="mt-6 text-3xl font-black text-primary">New Level!</h2>
              <p className="mt-2 text-base text-slate-600">
                The mascot unlocked fresh feathers just for you. Keep the streak alive to earn more coins.
              </p>
              <button
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-white shadow-lg transition hover:brightness-105"
                onClick={onClose}
              >
                <Sparkles size={18} /> Continue learning
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
