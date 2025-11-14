"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Frown } from "lucide-react";

interface WrongAnimationProps {
  correctAnswer: string;
  explanation: string;
}

export function WrongAnimation({ correctAnswer, explanation }: WrongAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 10 }}
      transition={{ type: "spring", stiffness: 700, damping: 30 }}
      className="rounded-3xl bg-white p-5 text-center shadow-xl"
    >
      <div className="flex flex-col items-center gap-3">
        <motion.div
          className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-50"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/svgs/sad.svg" alt="Sad mascot" width={72} height={72} priority />
        </motion.div>
        <div className="flex items-center gap-2 text-danger font-semibold">
          <Frown size={18} /> Not quite
        </div>
        <p className="text-sm text-slate-600">
          Correct answer: <strong>{correctAnswer}</strong>
        </p>
        <p className="text-sm text-slate-500">{explanation}</p>
      </div>
    </motion.div>
  );
}
