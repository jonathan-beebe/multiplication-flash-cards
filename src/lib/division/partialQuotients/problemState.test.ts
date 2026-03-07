import { describe, it, expect } from "vitest";
import {
  createSession,
  computeRemaining,
  sessionReducer,
} from "./problemState";
import type { SessionState } from "./problemState";

// A fixed problem for deterministic tests: 84 ÷ 4 = 21
const PROBLEM = { dividend: 84, divisor: 4, quotient: 21 };

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    problem: PROBLEM,
    sections: [],
    phase: "building",
    announcement: "",
    ...overrides,
  };
}

// ── createSession ─────────────────────────────────────────────────────────────

describe("createSession", () => {
  it("starts in building phase with no sections and empty announcement", () => {
    // We can't control generateProblem, so just verify shape/phase
    const session = createSession(1);
    expect(session.phase).toBe("building");
    expect(session.sections).toEqual([]);
    expect(session.announcement).toBe("");
    expect(session.problem.dividend).toBe(session.problem.divisor * session.problem.quotient);
  });

  it("starts with no sections, so remaining equals the full dividend", () => {
    const session = createSession(1);
    expect(computeRemaining(session.problem, session.sections)).toBe(session.problem.dividend);
  });
});

// ── computeRemaining ─────────────────────────────────────────────────────────

describe("computeRemaining", () => {
  it("returns dividend when no sections", () => {
    expect(computeRemaining(PROBLEM, [])).toBe(84);
  });

  it("subtracts accumulated areas", () => {
    const sections = [
      { partialQuotient: 10, area: 40 },
      { partialQuotient: 10, area: 40 },
    ];
    expect(computeRemaining(PROBLEM, sections)).toBe(4);
  });

  it("returns 0 when sections cover the full dividend", () => {
    const sections = [{ partialQuotient: 21, area: 84 }];
    expect(computeRemaining(PROBLEM, sections)).toBe(0);
  });
});

// ── sessionReducer — SUBMIT_BUILDING ─────────────────────────────────────────

describe("sessionReducer / SUBMIT_BUILDING", () => {
  it("adds a section and keeps building phase when remainder > 0", () => {
    const state = makeSession();
    const next = sessionReducer(state, { type: "SUBMIT_BUILDING", partialQuotient: 10 });

    expect(next.phase).toBe("building");
    expect(next.sections).toEqual([{ partialQuotient: 10, area: 40 }]);
    expect(computeRemaining(next.problem, next.sections)).toBe(44);
  });

  it("includes the subtracted area and remaining in the announcement", () => {
    const state = makeSession();
    const next = sessionReducer(state, { type: "SUBMIT_BUILDING", partialQuotient: 10 });

    expect(next.announcement).toContain("40");
    expect(next.announcement).toContain("44");
  });

  it("transitions to 'summing' when remainder hits 0 with multiple sections", () => {
    const state = makeSession({
      sections: [{ partialQuotient: 10, area: 40 }],
    });
    const next = sessionReducer(state, { type: "SUBMIT_BUILDING", partialQuotient: 11 });

    expect(next.phase).toBe("summing");
    expect(next.sections).toHaveLength(2);
    expect(computeRemaining(next.problem, next.sections)).toBe(0);
    expect(next.announcement).toContain("add the partial quotients");
  });

  it("transitions directly to 'done' when the first section covers the full dividend", () => {
    const state = makeSession();
    const next = sessionReducer(state, { type: "SUBMIT_BUILDING", partialQuotient: 21 });

    expect(next.phase).toBe("done");
    expect(next.sections).toHaveLength(1);
    expect(next.announcement).toContain("84");
    expect(next.announcement).toContain("21");
  });
});

// ── sessionReducer — SUBMIT_SUMMING ──────────────────────────────────────────

describe("sessionReducer / SUBMIT_SUMMING", () => {
  it("transitions to 'done' and sets the completion announcement", () => {
    const state = makeSession({
      phase: "summing",
      sections: [
        { partialQuotient: 10, area: 40 },
        { partialQuotient: 11, area: 44 },
      ],
    });
    const next = sessionReducer(state, { type: "SUBMIT_SUMMING" });

    expect(next.phase).toBe("done");
    expect(next.announcement).toContain("84");
    expect(next.announcement).toContain("21");
  });
});

// ── sessionReducer — NEXT ─────────────────────────────────────────────────────

describe("sessionReducer / NEXT", () => {
  it("resets to a fresh building session", () => {
    const state = makeSession({
      phase: "done",
      sections: [{ partialQuotient: 21, area: 84 }],
      announcement: "Correct!",
    });
    const next = sessionReducer(state, { type: "NEXT", level: 1 });

    expect(next.phase).toBe("building");
    expect(next.sections).toEqual([]);
    expect(next.announcement).toBe("");
    expect(computeRemaining(next.problem, next.sections)).toBe(next.problem.dividend);
  });
});
