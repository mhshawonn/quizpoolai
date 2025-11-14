"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import clsx from "classnames";

import mascotAnimation from "../public/lottie/mascot.json";

type MascotMood = "idle" | "celebrate" | "encourage" | "sad";

interface AnimatedMascotProps {
  mood?: MascotMood;
  size?: number;
  bubbleText?: string;
  className?: string;
}

const moodVariants: Record<MascotMood, { scale: number[]; rotate: number[] }> = {
  idle: { scale: [1, 1.02, 1], rotate: [0, 1, 0] },
  celebrate: { scale: [1, 1.1, 0.98], rotate: [0, -4, 2] },
  encourage: { scale: [1, 1.04, 1], rotate: [0, 2, -1] },
  sad: { scale: [1, 0.95, 1], rotate: [0, 0, 0] }
};

const segmentMap: Partial<Record<MascotMood, [number, number]>> = {
  celebrate: [0, 60],
  encourage: [60, 120],
  sad: [120, 180]
};

const mascotTransition = { type: "spring", stiffness: 700, damping: 30 };

export function AnimatedMascot({ mood = "idle", size = 220, bubbleText, className }: AnimatedMascotProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [fallback, setFallback] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const shouldUseFallback = fallback || !isClient;

  useEffect(() => {
    if (!lottieRef.current) return;
    const segment = segmentMap[mood];
    if (segment) {
      lottieRef.current.playSegments(segment, true);
    } else {
      lottieRef.current.goToAndPlay(0, true);
    }
  }, [mood]);

  const bubble = useMemo(() => {
    if (!bubbleText) return null;
    return (
      <motion.div
        className="glass-bubble absolute -top-4 right-0 max-w-[200px] rounded-3xl px-4 py-2 text-sm font-medium text-brandBlue shadow-lg"
        initial={{ opacity: 0, scale: 0.9, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={mascotTransition}
        aria-live="polite"
      >
        {bubbleText}
      </motion.div>
    );
  }, [bubbleText]);

  return (
    <motion.div
      className={clsx("relative inline-flex flex-col items-center", className)}
      animate={moodVariants[mood]}
      transition={mascotTransition}
    >
      {bubble}
      {shouldUseFallback ? (
        <MascotFallback mood={mood} size={size} />
      ) : (
        <Lottie
          aria-label="Friendly mascot"
          lottieRef={lottieRef}
          animationData={mascotAnimation}
          loop={mood !== "celebrate"}
          style={{ width: size, height: size }}
          onDOMLoaded={() => setFallback(false)}
        />
      )}
    </motion.div>
  );
}

function MascotFallback({ mood, size }: { mood: MascotMood; size: number }) {
  const colorMap: Record<MascotMood, string> = {
    idle: "#60d394",
    celebrate: "#2bb673",
    encourage: "#2f80ed",
    sad: "#ff6b6b"
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-hidden="true"
      initial={{ scale: 0.9 }}
      animate={{ scale: [0.95, 1.05, 1], y: [4, -4, 4] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <radialGradient id="mascotGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor={colorMap[mood]} />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#mascotGradient)" />
      <circle cx="75" cy="90" r="8" fill="#0f172a" />
      <circle cx="125" cy="90" r="8" fill="#0f172a" />
      <path
        d="M70 130 Q100 150 130 130"
        stroke="#0f172a"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
