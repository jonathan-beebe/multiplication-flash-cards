import { describe, it, expect } from "vitest";
import {
  generateProblem,
  getHelpfulFacts,
  validatePartialQuotient,
  validateSummingAnswer,
  LEVELS,
} from "@/lib/division/areaMode/divisionProblem";
import type { Level } from "@/lib/division/areaMode/divisionProblem";

const LEVELS_LIST: Level[] = [1, 2, 3, 4];

// ─── generateProblem ──────────────────────────────────────────────────────────

describe("generateProblem", () => {
  it.each(LEVELS_LIST)("level %i: dividend equals divisor × quotient", (level) => {
    for (let i = 0; i < 30; i++) {
      const { dividend, divisor, quotient } = generateProblem(level);
      expect(dividend).toBe(divisor * quotient);
    }
  });

  it.each(LEVELS_LIST)("level %i: divisor is within configured bounds", (level) => {
    const { divisorMin, divisorMax } = LEVELS[level];
    for (let i = 0; i < 30; i++) {
      const { divisor } = generateProblem(level);
      expect(divisor).toBeGreaterThanOrEqual(divisorMin);
      expect(divisor).toBeLessThanOrEqual(divisorMax);
    }
  });

  it.each(LEVELS_LIST)("level %i: quotient is within configured bounds", (level) => {
    const { quotientMin, quotientMax } = LEVELS[level];
    for (let i = 0; i < 30; i++) {
      const { quotient } = generateProblem(level);
      expect(quotient).toBeGreaterThanOrEqual(quotientMin);
      expect(quotient).toBeLessThanOrEqual(quotientMax);
    }
  });

  it.each(LEVELS_LIST)("level %i: quotient has at least two non-zero digits", (level) => {
    for (let i = 0; i < 30; i++) {
      const { quotient } = generateProblem(level);
      const nonZeroCount = String(quotient)
        .split("")
        .filter((d) => d !== "0").length;
      expect(nonZeroCount).toBeGreaterThanOrEqual(2);
    }
  });
});

// ─── validatePartialQuotient ──────────────────────────────────────────────────

describe("validatePartialQuotient", () => {
  // Using divisor=3, remaining=72 for all cases

  it("returns valid when value × divisor exactly equals remaining", () => {
    expect(validatePartialQuotient(24, 3, 72)).toEqual({ valid: true });
  });

  it("returns valid when value × divisor is less than remaining", () => {
    expect(validatePartialQuotient(20, 3, 72)).toEqual({ valid: true });
  });

  it("returns an error when value × divisor exceeds remaining", () => {
    const result = validatePartialQuotient(25, 3, 72); // 25 × 3 = 75 > 72
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toMatch(/Too big/i);
      expect(result.error).toContain("72"); // remaining shown in message
    }
  });

  it("returns an error for zero", () => {
    const result = validatePartialQuotient(0, 3, 72);
    expect(result.valid).toBe(false);
  });

  it("returns an error for a negative number", () => {
    const result = validatePartialQuotient(-5, 3, 72);
    expect(result.valid).toBe(false);
  });

  it("returns an error for a non-integer float", () => {
    const result = validatePartialQuotient(1.5, 3, 72);
    expect(result.valid).toBe(false);
  });
});

// ─── validateSummingAnswer ────────────────────────────────────────────────────

describe("validateSummingAnswer", () => {
  it("returns valid when the value matches the quotient", () => {
    expect(validateSummingAnswer(21, 21)).toEqual({ valid: true });
  });

  it("returns an error when the value is wrong", () => {
    const result = validateSummingAnswer(20, 21);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toMatch(/check your addition/i);
    }
  });

  it("returns an error for zero", () => {
    const result = validateSummingAnswer(0, 21);
    expect(result.valid).toBe(false);
  });

  it("returns an error for a negative number", () => {
    const result = validateSummingAnswer(-1, 21);
    expect(result.valid).toBe(false);
  });

  it("returns an error for NaN (unparseable input)", () => {
    const result = validateSummingAnswer(NaN, 21);
    expect(result.valid).toBe(false);
  });

  it("returns an error for a non-integer float", () => {
    const result = validateSummingAnswer(20.5, 21);
    expect(result.valid).toBe(false);
  });
});

// ─── getHelpfulFacts ──────────────────────────────────────────────────────────

describe("getHelpfulFacts", () => {
  it("only returns facts where divisor × multiplier ≤ dividend", () => {
    const facts = getHelpfulFacts(3, 72);
    for (const { product } of facts) {
      expect(product).toBeLessThanOrEqual(72);
    }
  });

  it("computes product correctly for each fact", () => {
    const facts = getHelpfulFacts(3, 72);
    for (const { multiplier, product } of facts) {
      expect(product).toBe(3 * multiplier);
    }
  });

  it("includes the largest standard multiplier whose product fits within the dividend", () => {
    // Multipliers list includes 20. 3 × 20 = 60 ≤ 72 ✓. 3 × 50 = 150 > 72 ✗.
    // So 20 should be the last multiplier included and 60 should be a product.
    const facts = getHelpfulFacts(3, 72);
    expect(facts.map((f) => f.multiplier)).toContain(20);
    expect(facts.map((f) => f.product)).toContain(60);
  });

  it("excludes facts whose product would exceed the dividend", () => {
    const facts = getHelpfulFacts(3, 72);
    // 3 × 50 = 150 > 72, so multiplier=50 should not appear
    expect(facts.map((f) => f.multiplier)).not.toContain(50);
  });

  it("returns an empty array when even multiplier=1 exceeds the dividend", () => {
    const facts = getHelpfulFacts(100, 5); // 100 × 1 = 100 > 5
    expect(facts).toHaveLength(0);
  });
});
