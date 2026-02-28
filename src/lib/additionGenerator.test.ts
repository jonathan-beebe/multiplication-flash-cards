import { describe, it, expect } from "vitest";
import { additionGenerator } from "./additionGenerator";

const { questionKey, parseQuestionKey, getNextQuestion, evaluate, generateChoices, displayText } =
  additionGenerator;

describe("additionGenerator", () => {
  describe("questionKey", () => {
    it("normalises order so commutiative pairs share a key", () => {
      expect(questionKey({ a: 3, b: 7 })).toBe("3+7");
      expect(questionKey({ a: 7, b: 3 })).toBe("3+7");
    });

    it("handles zeros", () => {
      expect(questionKey({ a: 0, b: 5 })).toBe("0+5");
    });
  });

  describe("parseQuestionKey", () => {
    it("round-trips through questionKey", () => {
      const q = { a: 12, b: 34 };
      const parsed = parseQuestionKey(questionKey(q));
      expect(parsed.a + parsed.b).toBe(q.a + q.b);
    });
  });

  describe("evaluate", () => {
    it("returns true for the correct sum", () => {
      expect(evaluate({ a: 347, b: 582 }, 929)).toBe(true);
    });

    it("returns false for wrong answers", () => {
      expect(evaluate({ a: 347, b: 582 }, 928)).toBe(false);
      expect(evaluate({ a: 347, b: 582 }, 930)).toBe(false);
    });

    it("handles zeros", () => {
      expect(evaluate({ a: 0, b: 0 }, 0)).toBe(true);
      expect(evaluate({ a: 0, b: 9999 }, 9999)).toBe(true);
    });
  });

  describe("generateChoices", () => {
    it("always includes the correct answer", () => {
      const q = { a: 123, b: 456 };
      const correct = 579;
      const choices = generateChoices(q);
      expect(choices).toContain(correct);
    });

    it("returns exactly 3 choices", () => {
      expect(generateChoices({ a: 0, b: 0 })).toHaveLength(3);
      expect(generateChoices({ a: 9999, b: 9999 })).toHaveLength(3);
      expect(generateChoices({ a: 50, b: 50 })).toHaveLength(3);
    });

    it("all choices are non-negative", () => {
      // smallest possible correct answer is 0+0=0; offsets could go negative
      const choices = generateChoices({ a: 0, b: 0 });
      for (const c of choices) {
        expect(c).toBeGreaterThanOrEqual(0);
      }
    });

    it("all choices are distinct", () => {
      for (let i = 0; i < 20; i++) {
        const a = Math.floor(Math.random() * 9999);
        const b = Math.floor(Math.random() * 9999);
        const choices = generateChoices({ a, b });
        expect(new Set(choices).size).toBe(3);
      }
    });
  });

  describe("getNextQuestion", () => {
    it("returns a question with operands in [0, 9999]", () => {
      const q = getNextQuestion([], Math.random());
      expect(q.a).toBeGreaterThanOrEqual(0);
      expect(q.a).toBeLessThanOrEqual(9999);
      expect(q.b).toBeGreaterThanOrEqual(0);
      expect(q.b).toBeLessThanOrEqual(9999);
    });

    it("avoids repeating the last question", () => {
      const last = { a: 500, b: 600 };
      const lastKey = questionKey(last);
      // Run many times and confirm we never get the same key back-to-back
      for (let i = 0; i < 30; i++) {
        const result = [{ question: last, correct: true }];
        const next = getNextQuestion(result, Math.random());
        expect(questionKey(next)).not.toBe(lastKey);
      }
    });
  });

  describe("displayText", () => {
    it("formats the question as a spoken string", () => {
      expect(displayText({ a: 3, b: 7 })).toBe("3 plus 7");
    });
  });
});
