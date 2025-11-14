"use client";

import { motion } from "framer-motion";
import clsx from "classnames";
import { CheckCircle2, XCircle } from "lucide-react";

export type AnswerState = "idle" | "correct" | "wrong" | "revealed";

interface Props {
  option: string;
  index: number;
  onSelect: () => void;
  disabled?: boolean;
  state?: AnswerState;
}

const transition = { type: "spring", stiffness: 700, damping: 30 };

export function AnswerButton({ option, index, onSelect, disabled, state = "idle" }: Props) {
  const statusClasses: Record<AnswerState, string> = {
    idle: "border-primary/30 bg-white hover:shadow-lg",
    correct: "border-primary bg-primary/10 shadow-lg",
    wrong: "border-danger bg-danger/10",
    revealed: "border-brandBlue/30 bg-brandBlue/5"
  };

  const icon =
    state === "correct" ? (
      <CheckCircle2 className="text-primary" size={22} aria-hidden="true" />
    ) : state === "wrong" ? (
      <XCircle className="text-danger" size={22} aria-hidden="true" />
    ) : null;

  const animateProps =
    state === "correct"
      ? { scale: [1, 1.06, 1], rotate: [0, -4, 0] }
      : state === "wrong"
        ? { x: [0, -6, 6, -3, 0] }
        : undefined;

  return (
    <motion.button
      layout
      role="listitem"
      aria-label={`Option ${index + 1}`}
      aria-disabled={disabled}
      aria-pressed={state === "correct"}
      onClick={onSelect}
      className={clsx(
        "relative flex w-full items-center gap-3 rounded-full border px-6 py-4 text-left font-semibold text-slate-700 shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brandBlue/40",
        statusClasses[state],
        disabled && "opacity-90"
      )}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      animate={animateProps}
      transition={transition}
      disabled={disabled}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brandBlue/10 text-brandBlue font-bold">
        {index + 1}
      </span>
      <span className="flex-1 text-base sm:text-lg">{option}</span>
      {icon}
      <motion.span
        className={clsx(
          "pointer-events-none absolute inset-0 rounded-full border-2 border-transparent",
          state !== "idle" && "border-primary/60"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: state === "idle" ? 0 : 1, scale: state === "idle" ? 0.98 : 1 }}
        transition={transition}
        aria-hidden="true"
      />
    </motion.button>
  );
}
