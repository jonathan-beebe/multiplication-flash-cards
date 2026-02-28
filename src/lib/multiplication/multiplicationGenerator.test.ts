import { describe, it, expect } from "vitest";
import { multiplicationGenerator, type Question } from "./multiplicationGenerator";
import type { QuestionResult } from "../engine/gameEngine";

const { questionKey, parseQuestionKey, getNextQuestion, evaluate, generateChoices, displayText } = multiplicationGenerator;

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
// parseQuestionKey
// ---------------------------------------------------------------------------

describe("parseQuestionKey", () => {
  it("parses a question key into a Question", () => {
    expect(parseQuestionKey("9x11")).toEqual({ a: 9, b: 11 });
  });

  it("handles equal factors", () => {
    expect(parseQuestionKey("5x5")).toEqual({ a: 5, b: 5 });
  });

  it("preserves factor order from key", () => {
    expect(parseQuestionKey("3x7")).toEqual({ a: 3, b: 7 });
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

  it("avoids repeating the last question", () => {
    const lastQ: Question = { a: 5, b: 6 };
    const results: QuestionResult<Question>[] = [
      { question: lastQ, correct: true },
    ];
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
    const results: QuestionResult<Question>[] = [];
    for (let i = 0; i < 10; i++) {
      results.push({
        question: { a: 3, b: 3 },
        correct: false,
      });
    }
    results.push({
      question: { a: 4, b: 5 },
      correct: true,
    });
    results.push({
      question: { a: 6, b: 7 },
      correct: true,
    });

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
// evaluate
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// generateChoices
// ---------------------------------------------------------------------------

describe("generateChoices", () => {
  it("returns exactly 3 choices", () => {
    expect(generateChoices({ a: 4, b: 5 })).toHaveLength(3);
  });

  it("always includes the correct answer", () => {
    for (let i = 0; i < 50; i++) {
      const q = { a: 6, b: 7 };
      const choices = generateChoices(q);
      expect(choices).toContain(q.a * q.b);
    }
  });

  it("returns unique values", () => {
    for (let i = 0; i < 50; i++) {
      const choices = generateChoices({ a: 8, b: 9 });
      expect(new Set(choices).size).toBe(3);
    }
  });
});

// ---------------------------------------------------------------------------
// displayText
// ---------------------------------------------------------------------------

describe("displayText", () => {
  it("returns screen-reader-friendly text", () => {
    expect(displayText({ a: 3, b: 7 })).toBe("3 times 7");
  });

  it("works with reversed factors", () => {
    expect(displayText({ a: 7, b: 3 })).toBe("7 times 3");
  });
});

// ---------------------------------------------------------------------------
// evaluate
// ---------------------------------------------------------------------------

describe("evaluate", () => {
  it("returns true for correct answer", () => {
    expect(evaluate({ a: 3, b: 7 }, 21)).toBe(true);
  });

  it("returns false for incorrect answer", () => {
    expect(evaluate({ a: 3, b: 7 }, 20)).toBe(false);
  });

  it("works with reversed factors", () => {
    expect(evaluate({ a: 7, b: 3 }, 21)).toBe(true);
  });
});
