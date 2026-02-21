import { describe, it, expect } from "vitest";
import {
  questionKey,
  getNextQuestion,
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
  type Question,
  type QuestionResult,
  type GameState,
} from "./multiplicationGameEngine";

// ---------------------------------------------------------------------------
// questionKey
// ---------------------------------------------------------------------------

describe("questionKey", () => {
  it("produces canonical key with smaller factor first", () => {
    expect(questionKey({ a: 7, b: 3 })).toBe("3x7");
    expect(questionKey({ a: 3, b: 7 })).toBe("3x7");
  });

  it("handles equal factors", () => {
    expect(questionKey({ a: 5, b: 5 })).toBe("5x5");
  });
});

// ---------------------------------------------------------------------------
// getNextQuestion
// ---------------------------------------------------------------------------

describe("getNextQuestion", () => {
  it("returns a question in the 3-12 range", () => {
    for (let i = 0; i < 20; i++) {
      const q = getNextQuestion([], i / 20);
      expect(q.a).toBeGreaterThanOrEqual(3);
      expect(q.a).toBeLessThanOrEqual(12);
      expect(q.b).toBeGreaterThanOrEqual(3);
      expect(q.b).toBeLessThanOrEqual(12);
    }
  });

  // We may want to eventually repeat questions that we are trying to review and reinforce, but we should avoid repeating the very last question right away.
  it("avoids repeating the last question", () => {
    const lastQ: Question = { a: 5, b: 6 };
    const results: QuestionResult[] = [
      { question: lastQ, wrongAnswers: [], timestamp: 1000 },
    ];
    // Run many times — should never get 5x6 or 6x5 back
    for (let i = 0; i < 50; i++) {
      const q = getNextQuestion(results, i / 50);
      const key = questionKey(q);
      expect(key).not.toBe("5x6");
    }
  });

  it("is deterministic with the same randomValue", () => {
    const a = getNextQuestion([], 0.42);
    const b = getNextQuestion([], 0.42);
    expect(a).toEqual(b);
  });

  it("weights toward struggling questions", () => {
    // Create results where 3x3 was always wrong and everything else was right
    const results: QuestionResult[] = [];
    for (let i = 0; i < 10; i++) {
      results.push({
        question: { a: 3, b: 3 },
        wrongAnswers: [10],
        timestamp: 1000 + i,
      });
    }
    // Add some correct answers for other questions
    results.push({
      question: { a: 4, b: 5 },
      wrongAnswers: [],
      timestamp: 2000,
    });
    results.push({
      question: { a: 6, b: 7 },
      wrongAnswers: [],
      timestamp: 2001,
    });

    // Sample many times and check that 3x3 appears more often
    let count3x3 = 0;
    const N = 100;
    for (let i = 0; i < N; i++) {
      const q = getNextQuestion(results, i / N);
      if (questionKey(q) === "3x3") count3x3++;
    }
    // 3x3 should appear noticeably more often than 1/55 ≈ 1.8%
    expect(count3x3).toBeGreaterThan(3);
  });
});

// ---------------------------------------------------------------------------
// State Transitions
// ---------------------------------------------------------------------------

describe("createGameState", () => {
  it("returns empty state", () => {
    const state = createGameState();
    expect(state.sessions).toEqual([]);
    expect(state.currentSessionId).toBeNull();
  });
});

describe("startSession", () => {
  it("creates a new session and sets it as current", () => {
    const state = startSession(createGameState(), "s1", 1000);
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].id).toBe("s1");
    expect(state.sessions[0].startedAt).toBe(1000);
    expect(state.sessions[0].results).toEqual([]);
    expect(state.currentSessionId).toBe("s1");
  });

  it("preserves previous sessions", () => {
    let state = startSession(createGameState(), "s1", 1000);
    state = startSession(state, "s2", 2000);
    expect(state.sessions).toHaveLength(2);
    expect(state.currentSessionId).toBe("s2");
  });

  it("returns a new object (immutability)", () => {
    const before = createGameState();
    const after = startSession(before, "s1", 1000);
    expect(before).not.toBe(after);
    expect(before.sessions).toHaveLength(0);
  });
});

describe("recordResult", () => {
  it("appends a result to the current session", () => {
    let state = startSession(createGameState(), "s1", 1000);
    state = recordResult(state, { a: 3, b: 4 }, [], 1001);
    const session = state.sessions[0];
    expect(session.results).toHaveLength(1);
    expect(session.results[0].question).toEqual({ a: 3, b: 4 });
    expect(session.results[0].wrongAnswers).toEqual([]);
    expect(session.results[0].timestamp).toBe(1001);
  });

  it("records wrong answers", () => {
    let state = startSession(createGameState(), "s1", 1000);
    state = recordResult(state, { a: 7, b: 8 }, [54, 55], 1001);
    expect(state.sessions[0].results[0].wrongAnswers).toEqual([54, 55]);
  });

  it("throws if no active session", () => {
    expect(() => {
      recordResult(createGameState(), { a: 3, b: 4 }, [], 1000);
    }).toThrow("No active session");
  });

  it("only appends to the current session", () => {
    let state = startSession(createGameState(), "s1", 1000);
    state = recordResult(state, { a: 3, b: 4 }, [], 1001);
    state = startSession(state, "s2", 2000);
    state = recordResult(state, { a: 5, b: 6 }, [], 2001);
    expect(state.sessions[0].results).toHaveLength(1);
    expect(state.sessions[1].results).toHaveLength(1);
  });

  it("is immutable", () => {
    let state = startSession(createGameState(), "s1", 1000);
    const before = state;
    state = recordResult(state, { a: 3, b: 4 }, [], 1001);
    expect(before.sessions[0].results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Queries / Derived Data
// ---------------------------------------------------------------------------

describe("getCurrentSession", () => {
  it("returns null when no active session", () => {
    expect(getCurrentSession(createGameState())).toBeNull();
  });

  it("returns the current session", () => {
    const state = startSession(createGameState(), "s1", 1000);
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
    const results: QuestionResult[] = [
      { question: { a: 3, b: 4 }, wrongAnswers: [], timestamp: 1000 },
      { question: { a: 5, b: 6 }, wrongAnswers: [29], timestamp: 1001 },
      { question: { a: 7, b: 8 }, wrongAnswers: [], timestamp: 1002 },
    ];
    const s = summarize(results);
    expect(s.totalQuestions).toBe(3);
    expect(s.firstTryCorrect).toBe(2);
    expect(s.neededRetry).toBe(1);
    expect(s.successRate).toBeCloseTo(2 / 3);
  });
});

describe("sessionSummary", () => {
  it("summarizes a session's results", () => {
    let state = startSession(createGameState(), "s1", 1000);
    state = recordResult(state, { a: 3, b: 4 }, [], 1001);
    state = recordResult(state, { a: 5, b: 6 }, [29], 1002);
    const s = sessionSummary(state.sessions[0]);
    expect(s.totalQuestions).toBe(2);
    expect(s.firstTryCorrect).toBe(1);
  });
});

describe("toDateStr", () => {
  it("converts epoch ms to YYYY-MM-DD", () => {
    // Jan 15, 2025 (some local time — depends on local timezone)
    const ts = new Date(2025, 0, 15).getTime();
    expect(toDateStr(ts)).toBe("2025-01-15");
  });
});

describe("daySummary", () => {
  it("summarizes results for a specific day", () => {
    const jan15 = new Date(2025, 0, 15, 10, 0, 0).getTime();
    const jan16 = new Date(2025, 0, 16, 10, 0, 0).getTime();

    let state = startSession(createGameState(), "s1", jan15);
    state = recordResult(state, { a: 3, b: 4 }, [], jan15 + 1000);
    state = recordResult(state, { a: 5, b: 6 }, [29], jan15 + 2000);

    state = startSession(state, "s2", jan16);
    state = recordResult(state, { a: 7, b: 8 }, [], jan16 + 1000);

    const s = daySummary(state, "2025-01-15");
    expect(s.totalQuestions).toBe(2);
    expect(s.firstTryCorrect).toBe(1);
  });
});

describe("questionStats", () => {
  it("groups by normalized question key", () => {
    const results: QuestionResult[] = [
      { question: { a: 3, b: 7 }, wrongAnswers: [], timestamp: 1000 },
      { question: { a: 7, b: 3 }, wrongAnswers: [20], timestamp: 1001 },
      { question: { a: 3, b: 7 }, wrongAnswers: [], timestamp: 1002 },
    ];
    const stats = questionStats(results);
    expect(stats).toHaveLength(1);
    expect(stats[0].question).toEqual({ a: 3, b: 7 });
    expect(stats[0].attempts).toBe(3);
    expect(stats[0].firstTryCorrect).toBe(2);
    expect(stats[0].needed_hints).toBe(1);
    expect(stats[0].successRate).toBeCloseTo(2 / 3);
  });

  it("returns empty array for no results", () => {
    expect(questionStats([])).toEqual([]);
  });
});

describe("strugglingQuestions", () => {
  it("returns questions sorted by success rate ascending", () => {
    const results: QuestionResult[] = [
      // 3x4: 1/2 correct
      { question: { a: 3, b: 4 }, wrongAnswers: [], timestamp: 1000 },
      { question: { a: 3, b: 4 }, wrongAnswers: [11], timestamp: 1001 },
      // 5x6: 0/2 correct
      { question: { a: 5, b: 6 }, wrongAnswers: [29], timestamp: 1002 },
      { question: { a: 5, b: 6 }, wrongAnswers: [31], timestamp: 1003 },
      // 7x8: 2/2 correct
      { question: { a: 7, b: 8 }, wrongAnswers: [], timestamp: 1004 },
      { question: { a: 7, b: 8 }, wrongAnswers: [], timestamp: 1005 },
    ];
    const struggling = strugglingQuestions(results);
    expect(struggling[0].question).toEqual({ a: 5, b: 6 });
    expect(struggling[0].successRate).toBe(0);
    expect(struggling[1].question).toEqual({ a: 3, b: 4 });
    expect(struggling[2].question).toEqual({ a: 7, b: 8 });
  });

  it("filters by minimum attempts", () => {
    const results: QuestionResult[] = [
      { question: { a: 3, b: 4 }, wrongAnswers: [11], timestamp: 1000 },
      { question: { a: 5, b: 6 }, wrongAnswers: [29], timestamp: 1001 },
      { question: { a: 5, b: 6 }, wrongAnswers: [31], timestamp: 1002 },
    ];
    const struggling = strugglingQuestions(results, 2);
    expect(struggling).toHaveLength(1);
    expect(struggling[0].question).toEqual({ a: 5, b: 6 });
  });

  it("respects limit", () => {
    const results: QuestionResult[] = [
      { question: { a: 3, b: 4 }, wrongAnswers: [11], timestamp: 1000 },
      { question: { a: 5, b: 6 }, wrongAnswers: [29], timestamp: 1001 },
      { question: { a: 7, b: 8 }, wrongAnswers: [55], timestamp: 1002 },
    ];
    const struggling = strugglingQuestions(results, 1, 2);
    expect(struggling).toHaveLength(2);
  });
});

describe("allResults", () => {
  it("flattens results across all sessions", () => {
    let state = startSession(createGameState(), "s1", 1000);
    state = recordResult(state, { a: 3, b: 4 }, [], 1001);
    state = startSession(state, "s2", 2000);
    state = recordResult(state, { a: 5, b: 6 }, [], 2001);
    state = recordResult(state, { a: 7, b: 8 }, [], 2002);

    const results = allResults(state);
    expect(results).toHaveLength(3);
  });
});
