import { act, renderHook } from "@testing-library/react";

import { useGamification } from "../hooks/useGamification";

describe("useGamification", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("rolls XP and levels up when threshold is reached", () => {
    const { result } = renderHook(() => useGamification());

    expect(result.current.level).toBe(1);
    expect(result.current.xp).toBe(0);

    act(() => {
      result.current.addXp(120);
    });

    expect(result.current.level).toBeGreaterThan(1);
    expect(result.current.xp).toBe(20);
  });

  it("records streak when completing a quiz on a new day", () => {
    const { result } = renderHook(() => useGamification());

    act(() => {
      result.current.completeQuiz(4);
    });

    expect(result.current.streak).toBeGreaterThanOrEqual(1);
  });
});
