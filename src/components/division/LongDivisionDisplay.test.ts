import { describe, it, expect } from "vitest";
import { buildSlots, alignmentForStep } from "./LongDivisionDisplay";
import { computeLongDivisionSteps } from "@/lib/division/standardAlgorithm/longDivision";

const NBSP = "\u00A0";

// ─── buildSlots ───────────────────────────────────────────────────────────────

describe("buildSlots", () => {
  it("places a single digit right-aligned to rightCol", () => {
    const { slots, signChar } = buildSlots(" ", 7, 2, 4);
    expect(slots).toEqual([NBSP, NBSP, "7", NBSP]);
    expect(signChar).toBe(NBSP);
  });

  it("places a multi-digit number right-aligned to rightCol", () => {
    const { slots } = buildSlots(" ", 123, 3, 5);
    // rightCol=3, len=3 → starts at col 1
    expect(slots).toEqual([NBSP, "1", "2", "3", NBSP]);
  });

  it("places a multi-digit value at the end of the grid", () => {
    const { slots } = buildSlots(" ", 657, 2, 3);
    expect(slots).toEqual(["6", "5", "7"]);
  });

  it("embeds the minus sign in the grid when space is available", () => {
    // value=27, rightCol=2, N=4 → digits at [1,2], signCol=0
    const { slots, signChar } = buildSlots("−", 27, 2, 4);
    expect(signChar).toBe(NBSP);
    expect(slots[0]).toBe("−");
    expect(slots[1]).toBe("2");
    expect(slots[2]).toBe("7");
    expect(slots[3]).toBe(NBSP);
  });

  it("returns the minus sign as signChar when the grid is full", () => {
    // value=27, rightCol=1, N=2 → digits fill cols [0,1], signCol=-1
    const { slots, signChar } = buildSlots("−", 27, 1, 2);
    expect(signChar).toBe("−");
    expect(slots).toEqual(["2", "7"]);
  });

  it("handles value=0 correctly", () => {
    const { slots } = buildSlots(" ", 0, 2, 3);
    expect(slots).toEqual([NBSP, NBSP, "0"]);
  });

  it("fills unoccupied slots with non-breaking spaces", () => {
    const { slots } = buildSlots(" ", 5, 0, 4);
    expect(slots).toEqual(["5", NBSP, NBSP, NBSP]);
  });
});

// ─── alignmentForStep ─────────────────────────────────────────────────────────

describe("alignmentForStep", () => {
  it("maps each step to its 1-indexed column for 657 ÷ 3 = 219", () => {
    // Dividend "657": step 0 → col 1 (digit '6'), step 1 → col 2 (digit '5'), step 2 → col 3 (digit '7')
    const steps = computeLongDivisionSteps(657, 3);
    expect(alignmentForStep(steps, 0)).toBe(1);
    expect(alignmentForStep(steps, 1)).toBe(2);
    expect(alignmentForStep(steps, 2)).toBe(3);
  });

  it("skips leading digits when divisor requires two digits to start (144 ÷ 12 = 12)", () => {
    // Dividend "144": step 0 uses "14" → rightmost column is 2, step 1 uses "24" → col 3
    const steps = computeLongDivisionSteps(144, 12);
    expect(alignmentForStep(steps, 0)).toBe(2);
    expect(alignmentForStep(steps, 1)).toBe(3);
  });

  it("accounts for remainder digits carrying over (306 ÷ 3 = 102)", () => {
    // step 0: working=3, rem=0 → col 1
    // step 1: working=0, rem=0 → col 2 (zero-digit step)
    // step 2: working=6, rem=0 → col 3
    const steps = computeLongDivisionSteps(306, 3);
    expect(alignmentForStep(steps, 0)).toBe(1);
    expect(alignmentForStep(steps, 1)).toBe(2);
    expect(alignmentForStep(steps, 2)).toBe(3);
  });

  it("handles a 4-digit dividend (9996 ÷ 4 = 2499)", () => {
    const steps = computeLongDivisionSteps(9996, 4);
    // Each step consumes one digit of "9996"
    expect(alignmentForStep(steps, 0)).toBe(1);
    expect(alignmentForStep(steps, steps.length - 1)).toBe(4);
  });
});
