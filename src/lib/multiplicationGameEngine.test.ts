import { describe, it, expect } from "vitest";
import {
  multiplicationGenerator,
  createGameState,
  startSession,
  recordResult,
  getCurrentSession,
  summarize,
  sessionSummary,
  questionStats,
  strugglingQuestions,
  allResults,
  toDateStr,
  serializeGameState,
  deserializeGameState,
  type Question,
  type QuestionResult,
} from "./multiplicationGameEngine";

const { questionKey } = multiplicationGenerator;

// ---------------------------------------------------------------------------
// Barrel re-export smoke tests — verify the old import path still works
// ---------------------------------------------------------------------------

describe("barrel re-exports", () => {
  it("re-exports questionKey via generator", () => {
    expect(questionKey({ a: 7, b: 3 })).toBe("3x7");
  });

  it("re-exports createGameState", () => {
    const state = createGameState<Question>();
    expect(state.sessions).toEqual([]);
  });

  it("re-exports startSession and recordResult with new correct: boolean API", () => {
    let state = startSession(createGameState<Question>(), "s1", 1000);
    state = recordResult(state, { a: 3, b: 4 }, true);
    expect(state.sessions[0].results).toHaveLength(1);
    expect(state.sessions[0].results[0].correct).toBe(true);
  });

  it("re-exports serialization functions that accept generator", () => {
    let state = startSession(createGameState<Question>(), "s1", 1000);
    state = recordResult(state, { a: 3, b: 4 }, true);
    state = recordResult(state, { a: 6, b: 5 }, false);

    const json = serializeGameState(state, multiplicationGenerator);
    const parsed = JSON.parse(json);
    expect(parsed.v).toBe(3);
    expect(parsed.sessions[0].d).toEqual([["3x4", 1], ["5x6", 0]]);

    const restored = deserializeGameState(json, multiplicationGenerator);
    expect(allResults(restored)).toHaveLength(2);
  });

  it("re-exports questionStats and strugglingQuestions that accept generator", () => {
    const results: QuestionResult<Question>[] = [
      { question: { a: 3, b: 7 }, correct: true },
      { question: { a: 7, b: 3 }, correct: false },
    ];
    const stats = questionStats(results, multiplicationGenerator);
    expect(stats).toHaveLength(1);
    expect(stats[0].attempts).toBe(2);

    const struggling = strugglingQuestions(results, multiplicationGenerator);
    expect(struggling).toHaveLength(1);
  });

  it("re-exports query functions unchanged", () => {
    let state = startSession(createGameState<Question>(), "s1", 1000);
    state = recordResult(state, { a: 3, b: 4 }, true);

    expect(getCurrentSession(state)!.id).toBe("s1");
    expect(summarize(allResults(state)).totalQuestions).toBe(1);
    expect(sessionSummary(state.sessions[0]).firstTryCorrect).toBe(1);

    const ts = new Date(2025, 0, 15).getTime();
    expect(toDateStr(ts)).toBe("2025-01-15");
  });
});
