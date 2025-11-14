"use client";

import { useCallback, useMemo, useState } from "react";

import { useLocalQuizzes, XP_THRESHOLD } from "./useLocalQuizzes";

// XP helper snippet mirrored from the spec to document rollover logic.
export const XP_PER_CORRECT = 10;

export function useGamification() {
  const {
    quizzes,
    addQuiz,
    removeQuiz,
    updateScore,
    xp,
    level,
    streak,
    lastCompletionDate,
    addXp: baseAddXp,
    completeQuiz
  } = useLocalQuizzes();

  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const xpProgress = xp / XP_THRESHOLD;

  const addXp = useCallback(
    (points = XP_PER_CORRECT) => {
      const result = baseAddXp(points);
      if (result.leveledUp) {
        setLevelUpVisible(true);
      }
      return result;
    },
    [baseAddXp]
  );

  const closeLevelUpModal = useCallback(() => setLevelUpVisible(false), []);

  return useMemo(
    () => ({
      quizzes,
      addQuiz,
      removeQuiz,
      updateScore,
      xp,
      level,
      streak,
      lastCompletionDate,
      xpProgress,
      addXp,
      completeQuiz,
      levelUpVisible,
      closeLevelUpModal,
      xpPerCorrect: XP_PER_CORRECT,
      xpThreshold: XP_THRESHOLD
    }),
    [
      quizzes,
      addQuiz,
      removeQuiz,
      updateScore,
      xp,
      level,
      streak,
      lastCompletionDate,
      xpProgress,
      addXp,
      completeQuiz,
      levelUpVisible,
      closeLevelUpModal
    ]
  );
}
