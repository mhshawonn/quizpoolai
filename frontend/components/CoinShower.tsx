"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";

interface CoinShowerProps {
  trigger: number;
  duration?: number;
}

export function CoinShower({ trigger, duration = 1200 }: CoinShowerProps) {
  const [active, setActive] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (!trigger) return;
    setActive(true);
    const timeout = setTimeout(() => setActive(false), duration);
    return () => clearTimeout(timeout);
  }, [trigger, duration]);

  if (!active || dimensions.width === 0) {
    return null;
  }

  return (
    <Confetti
      width={dimensions.width}
      height={dimensions.height}
      numberOfPieces={160}
      recycle={false}
      gravity={0.3}
      colors={["#ffd164", "#ffeaa7", "#ffb347", "#fff2cc"]}
      drawShape={(ctx) => {
        ctx.fillStyle = "#ffd164";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#f2a900";
        ctx.stroke();
      }}
    />
  );
}
