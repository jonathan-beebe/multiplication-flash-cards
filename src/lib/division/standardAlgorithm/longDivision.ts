export interface LongDivisionStep {
  /** The number being divided at this step (previous remainder × 10 + next digit). */
  workingNumber: number;
  /** Exact digit placed in the quotient: Math.floor(workingNumber / divisor). */
  quotientDigit: number;
  /** quotientDigit × divisor */
  product: number;
  /** workingNumber - product */
  remainder: number;
}

/**
 * Computes the step-by-step breakdown of dividend ÷ divisor using the
 * standard long division algorithm. One step per quotient digit.
 *
 * Assumes dividend divides evenly (no remainder), which the problem
 * generator guarantees.
 */
export function computeLongDivisionSteps(
  dividend: number,
  divisor: number
): LongDivisionStep[] {
  const digits = String(dividend).split("").map(Number);
  const steps: LongDivisionStep[] = [];
  let working = 0;
  let stepStarted = false;

  for (let i = 0; i < digits.length; i++) {
    working = working * 10 + digits[i];

    // If working < divisor and we haven't started yet, continue accumulating.
    // Once the quotient has begun, every digit produces a step (including 0).
    if (working < divisor && !stepStarted) {
      continue;
    }

    stepStarted = true;
    const quotientDigit = Math.floor(working / divisor);
    const product = quotientDigit * divisor;
    const remainder = working - product;

    steps.push({ workingNumber: working, quotientDigit, product, remainder });
    working = remainder;
  }

  return steps;
}

/**
 * Computes the 0-based index of the rightmost dividend column consumed by
 * each step. Runs in O(n) by accumulating consumed digits instead of
 * recomputing from the start for every step.
 *
 * For example, 657 ÷ 3 = 219 yields [0, 1, 2] — each step aligns to the
 * next dividend digit column.
 */
export function computeRightCols(steps: LongDivisionStep[]): number[] {
  const result: number[] = [];
  let consumed = 0;
  for (let i = 0; i < steps.length; i++) {
    const wLen = String(steps[i].workingNumber).length;
    const prevRem = i === 0 ? 0 : steps[i - 1].remainder;
    const prevRemLen = prevRem === 0 ? 0 : String(prevRem).length;
    consumed += wLen - prevRemLen;
    result.push(consumed - 1);
  }
  return result;
}

/**
 * Validates that the value entered by the student is the correct quotient
 * digit for the current step.
 */
export function validateQuotientDigit(
  value: number,
  step: LongDivisionStep
): { valid: true } | { valid: false; error: string } {
  if (!Number.isInteger(value) || value < 0 || value > 9) {
    return { valid: false, error: "Enter a single digit (0–9)" };
  }
  if (value !== step.quotientDigit) {
    return {
      valid: false,
      error: `Not quite — how many times does the divisor fit?`,
    };
  }
  return { valid: true };
}
