import { describe, it, expect } from "vitest";
import { subtractionGenerator } from "./subtractionGenerator";

const { questionKey, getNextQuestion, evaluate, generateChoices, displayText } =
  subtractionGenerator;

describe("subtractionGenerator", () => {
  describe("questionKey", () => {
    it("preserves order (subtraction is not commutative)", () => {
      expect(questionKey({ a: 10, b: 3 })).toBe("10-3");
      expect(questionKey({ a: 3, b: 10 })).not.toBe(questionKey({ a: 10, b: 3 }));
    });

    it("handles zeros", () => {
      expect(questionKey({ a: 5, b: 0 })).toBe("5-0");
    });
  });

  describe("evaluate", () => {
    it("returns true for the correct difference", () => {
      expect(evaluate({ a: 900, b: 350 }, 550)).toBe(true);
    });

    it("returns false for wrong answers", () => {
      expect(evaluate({ a: 900, b: 350 }, 549)).toBe(false);
      expect(evaluate({ a: 900, b: 350 }, 551)).toBe(false);
    });

    it("handles zero subtrahend", () => {
      expect(evaluate({ a: 42, b: 0 }, 42)).toBe(true);
    });

    it("handles equal operands (answer is 0)", () => {
      expect(evaluate({ a: 7, b: 7 }, 0)).toBe(true);
    });
  });

  describe("generateChoices", () => {
    it("always includes the correct answer", () => {
      const q = { a: 800, b: 375 };
      const correct = 425;
      const choices = generateChoices(q);
      expect(choices).toContain(correct);
    });

    it("returns exactly 3 choices", () => {
      expect(generateChoices({ a: 0, b: 0 })).toHaveLength(3);
      expect(generateChoices({ a: 9999, b: 9999 })).toHaveLength(3);
      expect(generateChoices({ a: 5000, b: 2500 })).toHaveLength(3);
    });

    it("all choices are non-negative", () => {
      // answer is 0; offsets must not produce negatives
      const choices = generateChoices({ a: 0, b: 0 });
      for (const c of choices) {
        expect(c).toBeGreaterThanOrEqual(0);
      }
    });

    it("all choices are distinct", () => {
      for (let i = 0; i < 20; i++) {
        const a = Math.floor(Math.random() * 9999);
        const b = Math.floor(Math.random() * (a + 1));
        const choices = generateChoices({ a, b });
        expect(new Set(choices).size).toBe(3);
      }
    });
  });

  describe("getNextQuestion", () => {
    it("returns a question where b ≤ a (non-negative answer)", () => {
      for (let i = 0; i < 30; i++) {
        const q = getNextQuestion([], Math.random());
        expect(q.b).toBeLessThanOrEqual(q.a);
      }
    });

    it("operands are in [0, 9999]", () => {
      const q = getNextQuestion([], 0.5);
      expect(q.a).toBeGreaterThanOrEqual(0);
      expect(q.a).toBeLessThanOrEqual(9999);
      expect(q.b).toBeGreaterThanOrEqual(0);
    });

    it("avoids repeating the last question", () => {
      const last = { a: 500, b: 200 };
      const lastKey = questionKey(last);
      for (let i = 0; i < 30; i++) {
        const next = getNextQuestion([{ question: last, correct: true }], Math.random());
        expect(questionKey(next)).not.toBe(lastKey);
      }
    });
  });

  describe("displayText", () => {
    it("formats the question as a spoken string", () => {
      expect(displayText({ a: 10, b: 4 })).toBe("10 minus 4");
    });
  });
});
