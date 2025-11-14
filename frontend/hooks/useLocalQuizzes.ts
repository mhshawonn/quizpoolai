"use client";

import { useCallback, useEffect, useState } from "react";

import type { QuizApiResponse } from "../lib/api";

export interface StoredQuiz extends QuizApiResponse {
  id: string;
  videoId: string;
  youtubeUrl: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  createdAt: number;
  score?: number;
}

interface StorageState {
  quizzes: StoredQuiz[];
  xp: number;
  level: number;
  streak: number;
  lastCompletionDate: string | null;
}

const STORAGE_KEY = "quizpoolai.quizzes";
const DEFAULT_STATE: StorageState = {
  quizzes: [],
  xp: 0,
  level: 1,
  streak: 0,
  lastCompletionDate: null
};
export const XP_THRESHOLD = 100;

export function useLocalQuizzes() {
  const [state, setState] = useState<StorageState>(DEFAULT_STATE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setState((prev) => ({ ...prev, quizzes: parsed }));
        return;
      }
      setState({
        ...DEFAULT_STATE,
        ...parsed,
        quizzes: parsed.quizzes ?? []
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const persist = useCallback((next: StorageState | ((prev: StorageState) => StorageState)) => {
    setState((prev) => {
      const resolved =
        typeof next === "function" ? (next as (current: StorageState) => StorageState)(prev) : next;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
      }
      return resolved;
    });
  }, []);

  const addQuiz = useCallback(
    (quiz: StoredQuiz) => {
      persist((prev) => ({
        ...prev,
        quizzes: [quiz, ...prev.quizzes.filter((q) => q.id !== quiz.id)]
      }));
    },
    [persist]
  );

  const removeQuiz = useCallback(
    (id: string) => {
      persist((prev) => ({ ...prev, quizzes: prev.quizzes.filter((quiz) => quiz.id !== id) }));
    },
    [persist]
  );

  const updateScore = useCallback(
    (id: string, score: number) => {
      persist((prev) => ({
        ...prev,
        quizzes: prev.quizzes.map((quiz) => (quiz.id === id ? { ...quiz, score } : quiz))
      }));
    },
    [persist]
  );

  const addXp = useCallback(
    (points: number) => {
      let meta = { leveledUp: false, xp: state.xp, level: state.level };
      persist((prev) => {
        let xp = prev.xp + Math.max(0, points);
        let level = prev.level;
        let leveledUp = false;
        while (xp >= XP_THRESHOLD) {
          xp -= XP_THRESHOLD;
          level += 1;
          leveledUp = true;
        }
        meta = { leveledUp, xp, level };
        return { ...prev, xp, level };
      });
      return meta;
    },
    [persist, state.level, state.xp]
  );

  const completeQuiz = useCallback(
    (score: number) => {
      const today = new Date();
      const todayKey = today.toDateString();
      let meta = { streak: state.streak };

      persist((prev) => {
        if (prev.lastCompletionDate === todayKey) {
          meta = { streak: prev.streak };
          return prev;
        }
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const streak =
          prev.lastCompletionDate === yesterday.toDateString() ? prev.streak + 1 : 1;
        meta = { streak };
        return { ...prev, streak, lastCompletionDate: todayKey };
      });

      return meta;
    },
    [persist, state.streak]
  );

  return {
    quizzes: state.quizzes,
    addQuiz,
    removeQuiz,
    updateScore,
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    lastCompletionDate: state.lastCompletionDate,
    addXp,
    completeQuiz
  };
}
