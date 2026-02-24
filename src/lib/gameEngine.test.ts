import { describe, it, expect } from "vitest";
import {
  createGameState,
  startSession,
  recordResult,
  getCurrentSession,
  summarize,
  sessionSummary,
  daySummary,
  questionStats,
  strugglingQuestions,
  allResults,
  toDateStr,
  serializeGameState,
  deserializeGameState,
  type QuestionGenerator,
  type QuestionResult,
} from "./gameEngine";

// ---------------------------------------------------------------------------
// Trivial test generator: questions are just numbers, key is the number itself
// ---------------------------------------------------------------------------

interface NumQuestion {
  value: number;
}

const testGenerator: QuestionGenerator<NumQuestion> = {
  questionKey: (q) => String(q.value),
  parseQuestionKey: (key) => ({ value: Number(key) }),
  getNextQuestion: (_prev, rand) => ({ value: Math.floor(rand * 10) }),
  evaluate: (q, answer) => answer === q.value * 2,
};

// Helper to build results quickly
function correct(value: number): QuestionResult<NumQuestion> {
  return { question: { value }, correct: true };
}
function incorrect(value: number): QuestionResult<NumQuestion> {
  return { question: { value }, correct: false };
}

// ---------------------------------------------------------------------------
// State Transitions
// ---------------------------------------------------------------------------

describe("createGameState", () => {
  it("returns empty state", () => {
    const state = createGameState<NumQuestion>();
    expect(state.sessions).toEqual([]);
    expect(state.currentSessionId).toBeNull();
  });
});

describe("startSession", () => {
  it("creates a new session and sets it as current", () => {
    const state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].id).toBe("s1");
    expect(state.sessions[0].startedAt).toBe(1000);
    expect(state.sessions[0].results).toEqual([]);
    expect(state.currentSessionId).toBe("s1");
  });

  it("preserves previous sessions", () => {
    let state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    state = startSession(state, "s2", 2000);
    expect(state.sessions).toHaveLength(2);
    expect(state.currentSessionId).toBe("s2");
  });

  it("returns a new object (immutability)", () => {
    const before = createGameState<NumQuestion>();
    const after = startSession(before, "s1", 1000);
    expect(before).not.toBe(after);
    expect(before.sessions).toHaveLength(0);
  });
});

describe("recordResult", () => {
  it("appends a correct result to the current session", () => {
    let state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    state = recordResult(state, { value: 5 }, true);
    const session = state.sessions[0];
    expect(session.results).toHaveLength(1);
    expect(session.results[0].question).toEqual({ value: 5 });
    expect(session.results[0].correct).toBe(true);
  });

  it("records an incorrect result", () => {
    let state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    state = recordResult(state, { value: 7 }, false);
    expect(state.sessions[0].results[0].correct).toBe(false);
  });

  it("throws if no active session", () => {
    expect(() => {
      recordResult(createGameState<NumQuestion>(), { value: 1 }, true);
    }).toThrow("No active session");
  });

  it("only appends to the current session", () => {
    let state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    state = recordResult(state, { value: 1 }, true);
    state = startSession(state, "s2", 2000);
    state = recordResult(state, { value: 2 }, true);
    expect(state.sessions[0].results).toHaveLength(1);
    expect(state.sessions[1].results).toHaveLength(1);
  });

  it("is immutable", () => {
    let state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    const before = state;
    state = recordResult(state, { value: 3 }, true);
    expect(before.sessions[0].results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Queries / Derived Data
// ---------------------------------------------------------------------------

describe("getCurrentSession", () => {
  it("returns null when no active session", () => {
    expect(getCurrentSession(createGameState<NumQuestion>())).toBeNull();
  });

  it("returns the current session", () => {
    const state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    const session = getCurrentSession(state);
    expect(session).not.toBeNull();
    expect(session!.id).toBe("s1");
  });
});

describe("summarize", () => {
  it("returns zeros for empty results", () => {
    const s = summarize([]);
    expect(s.totalQuestions).toBe(0);
    expect(s.firstTryCorrect).toBe(0);
    expect(s.neededRetry).toBe(0);
    expect(s.successRate).toBe(0);
  });

  it("computes correct summary", () => {
    const results = [correct(1), incorrect(2), correct(3)];
    const s = summarize(results);
    expect(s.totalQuestions).toBe(3);
    expect(s.firstTryCorrect).toBe(2);
    expect(s.neededRetry).toBe(1);
    expect(s.successRate).toBeCloseTo(2 / 3);
  });
});

describe("sessionSummary", () => {
  it("summarizes a session's results", () => {
    let state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    state = recordResult(state, { value: 1 }, true);
    state = recordResult(state, { value: 2 }, false);
    const s = sessionSummary(state.sessions[0]);
    expect(s.totalQuestions).toBe(2);
    expect(s.firstTryCorrect).toBe(1);
  });
});

describe("toDateStr", () => {
  it("converts epoch ms to YYYY-MM-DD", () => {
    const ts = new Date(2025, 0, 15).getTime();
    expect(toDateStr(ts)).toBe("2025-01-15");
  });
});

describe("daySummary", () => {
  it("summarizes results for a specific day", () => {
    const jan15 = new Date(2025, 0, 15, 10, 0, 0).getTime();
    const jan16 = new Date(2025, 0, 16, 10, 0, 0).getTime();

    let state = startSession(createGameState<NumQuestion>(), "s1", jan15);
    state = recordResult(state, { value: 1 }, true);
    state = recordResult(state, { value: 2 }, false);

    state = startSession(state, "s2", jan16);
    state = recordResult(state, { value: 3 }, true);

    const s = daySummary(state, "2025-01-15");
    expect(s.totalQuestions).toBe(2);
    expect(s.firstTryCorrect).toBe(1);
  });
});

describe("questionStats", () => {
  it("groups by question key", () => {
    const results = [correct(5), incorrect(5), correct(5)];
    const stats = questionStats(results, testGenerator);
    expect(stats).toHaveLength(1);
    expect(stats[0].question).toEqual({ value: 5 });
    expect(stats[0].attempts).toBe(3);
    expect(stats[0].firstTryCorrect).toBe(2);
    expect(stats[0].needed_hints).toBe(1);
    expect(stats[0].successRate).toBeCloseTo(2 / 3);
  });

  it("returns empty array for no results", () => {
    expect(questionStats([], testGenerator)).toEqual([]);
  });
});

describe("strugglingQuestions", () => {
  it("returns questions sorted by success rate ascending", () => {
    const results = [
      // value 1: 1/2 correct
      correct(1), incorrect(1),
      // value 2: 0/2 correct
      incorrect(2), incorrect(2),
      // value 3: 2/2 correct
      correct(3), correct(3),
    ];
    const struggling = strugglingQuestions(results, testGenerator);
    expect(struggling[0].question).toEqual({ value: 2 });
    expect(struggling[0].successRate).toBe(0);
    expect(struggling[1].question).toEqual({ value: 1 });
    expect(struggling[2].question).toEqual({ value: 3 });
  });

  it("filters by minimum attempts", () => {
    const results = [
      incorrect(1),
      incorrect(2), incorrect(2),
    ];
    const struggling = strugglingQuestions(results, testGenerator, 2);
    expect(struggling).toHaveLength(1);
    expect(struggling[0].question).toEqual({ value: 2 });
  });

  it("respects limit", () => {
    const results = [incorrect(1), incorrect(2), incorrect(3)];
    const struggling = strugglingQuestions(results, testGenerator, 1, 2);
    expect(struggling).toHaveLength(2);
  });
});

describe("allResults", () => {
  it("flattens results across all sessions", () => {
    let state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    state = recordResult(state, { value: 1 }, true);
    state = startSession(state, "s2", 2000);
    state = recordResult(state, { value: 2 }, true);
    state = recordResult(state, { value: 3 }, false);

    const results = allResults(state);
    expect(results).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Serialization / Deserialization
// ---------------------------------------------------------------------------

describe("serializeGameState / deserializeGameState", () => {
  it("produces v2 compact format with right/wrong arrays", () => {
    let state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    state = recordResult(state, { value: 3 }, true);
    state = recordResult(state, { value: 5 }, false);
    state = recordResult(state, { value: 7 }, true);

    const json = serializeGameState(state, testGenerator);
    const parsed = JSON.parse(json);

    expect(parsed.v).toBe(2);
    expect(parsed.sessions).toHaveLength(1);
    expect(parsed.sessions[0].i).toBe("s1");
    expect(parsed.sessions[0].t).toBe(1000);
    expect(parsed.sessions[0].r).toEqual(["3", "7"]);
    expect(parsed.sessions[0].w).toEqual(["5"]);
    expect(parsed.currentSessionId).toBe("s1");
  });

  it("round-trips a state with sessions and results", () => {
    let state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    state = recordResult(state, { value: 1 }, true);
    state = recordResult(state, { value: 2 }, false);
    state = startSession(state, "s2", 2000);
    state = recordResult(state, { value: 3 }, true);

    const json = serializeGameState(state, testGenerator);
    const restored = deserializeGameState(json, testGenerator);

    expect(restored.sessions).toHaveLength(2);
    expect(restored.currentSessionId).toBe("s2");
    expect(allResults(restored)).toHaveLength(3);
  });

  it("round-trips preserving summarize behavior", () => {
    let state = startSession(createGameState<NumQuestion>(), "s1", 1000);
    state = recordResult(state, { value: 1 }, true);
    state = recordResult(state, { value: 2 }, false);
    state = recordResult(state, { value: 3 }, true);

    const originalSummary = summarize(allResults(state));

    const json = serializeGameState(state, testGenerator);
    const restored = deserializeGameState(json, testGenerator);
    const restoredSummary = summarize(allResults(restored));

    expect(restoredSummary).toEqual(originalSummary);
  });

  it("round-trips an empty state", () => {
    const state = createGameState<NumQuestion>();
    const json = serializeGameState(state, testGenerator);
    const restored = deserializeGameState(json, testGenerator);
    expect(restored).toEqual(state);
  });

  it("returns empty state for invalid JSON", () => {
    const restored = deserializeGameState("not valid json", testGenerator);
    expect(restored).toEqual(createGameState<NumQuestion>());
  });

  it("returns empty state for JSON missing sessions array", () => {
    const restored = deserializeGameState('{"currentSessionId": null}', testGenerator);
    expect(restored).toEqual(createGameState<NumQuestion>());
  });

  it("returns empty state for JSON with non-array sessions", () => {
    const restored = deserializeGameState('{"sessions": "oops", "currentSessionId": null}', testGenerator);
    expect(restored).toEqual(createGameState<NumQuestion>());
  });
});
