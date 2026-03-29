import { describe, it, expect } from 'vitest'
import { buildAnnouncement, computeLongDivisionSteps, computeRightCols, validateQuotientDigit } from './longDivision'

// ─── computeLongDivisionSteps ─────────────────────────────────────────────────

describe('computeLongDivisionSteps', () => {
  it('657 ÷ 3 → three steps with correct quotient digits', () => {
    const steps = computeLongDivisionSteps(657, 3)
    expect(steps).toHaveLength(3)
    expect(steps.map((s) => s.quotientDigit)).toEqual([2, 1, 9])
    expect(steps.map((s) => s.workingNumber)).toEqual([6, 5, 27])
    expect(steps.map((s) => s.product)).toEqual([6, 3, 27])
    expect(steps.map((s) => s.remainder)).toEqual([0, 2, 0])
  })

  it('produces a step for each quotient digit, including zero digits', () => {
    // 306 ÷ 3 = 102 → quotient digits [1, 0, 2]
    const steps = computeLongDivisionSteps(306, 3)
    expect(steps).toHaveLength(3)
    expect(steps.map((s) => s.quotientDigit)).toEqual([1, 0, 2])
  })

  it('works when divisor is larger than leading digit', () => {
    // 78 ÷ 6 = 13 → two steps: working=7 (skip), working=78? No —
    // 6 doesn't go into 7... wait: 6 goes into 7 once.
    // Actually 78÷6=13: step1 working=7 → digit 1, rem 1; step2 working=18 → digit 3, rem 0
    const steps = computeLongDivisionSteps(78, 6)
    expect(steps).toHaveLength(2)
    expect(steps.map((s) => s.quotientDigit)).toEqual([1, 3])
    expect(steps[0].workingNumber).toBe(7)
    expect(steps[1].workingNumber).toBe(18)
  })

  it('works when divisor is greater than leading digit (needs two digits first)', () => {
    // 96 ÷ 8 = 12 → working=9 (9<8? no, 8 goes into 9 once) → digit 1, rem 1 → working=16 → digit 2
    const steps = computeLongDivisionSteps(96, 8)
    expect(steps).toHaveLength(2)
    expect(steps.map((s) => s.quotientDigit)).toEqual([1, 2])
  })

  it('handles a dividend where divisor is larger than leading digit', () => {
    // 144 ÷ 12 = 12 → working=1 (1<12, skip), working=14 (step1: 14÷12=1, rem 2), working=24 (step2: 24÷12=2, rem 0)
    const steps = computeLongDivisionSteps(144, 12)
    expect(steps).toHaveLength(2)
    expect(steps.map((s) => s.quotientDigit)).toEqual([1, 2])
    expect(steps[0].workingNumber).toBe(14)
    expect(steps[1].workingNumber).toBe(24)
  })

  it("step remainder always feeds into next step's working number", () => {
    const steps = computeLongDivisionSteps(657, 3)
    for (let i = 0; i < steps.length - 1; i++) {
      // next working = remainder * 10 + next digit (verified by checking products)
      expect(steps[i + 1].workingNumber).toBeGreaterThanOrEqual(steps[i].remainder * 10)
    }
  })

  it('final step always has remainder 0 (evenly divisible)', () => {
    const cases = [
      [657, 3],
      [306, 3],
      [144, 12],
      [9999, 9],
      [1001, 7],
    ] as const
    for (const [dividend, divisor] of cases) {
      const steps = computeLongDivisionSteps(dividend, divisor)
      expect(steps.at(-1)?.remainder).toBe(0)
    }
  })

  it('product = quotientDigit × divisor for every step', () => {
    const steps = computeLongDivisionSteps(657, 3)
    for (const step of steps) {
      expect(step.product).toBe(step.quotientDigit * 3)
    }
  })
})

// ─── buildAnnouncement ────────────────────────────────────────────────────────

describe('buildAnnouncement', () => {
  const problem = { dividend: 657, divisor: 3, quotient: 219 }
  const step = { workingNumber: 27, quotientDigit: 9, product: 27, remainder: 0 }

  it('returns a completion message on the last step', () => {
    const msg = buildAnnouncement(9, step, problem, 3, 3)
    expect(msg).toBe('Correct! 657 divided by 3 equals 219.')
  })

  it('uses toLocaleString for large dividends in the completion message', () => {
    const bigProblem = { dividend: 1_000_000, divisor: 4, quotient: 250_000 }
    const msg = buildAnnouncement(2, step, bigProblem, 7, 7)
    expect(msg).toContain('1,000,000')
  })

  it('returns a progress message for intermediate steps', () => {
    const midStep = { workingNumber: 6, quotientDigit: 2, product: 6, remainder: 0 }
    const msg = buildAnnouncement(2, midStep, problem, 1, 3)
    expect(msg).toBe('2 is correct. 6 subtracted, 0 remaining. Bring down the next digit.')
  })
})

// ─── computeRightCols ─────────────────────────────────────────────────────────

describe('computeRightCols', () => {
  it('657 ÷ 3 = 219 → each step aligns to successive dividend columns', () => {
    const steps = computeLongDivisionSteps(657, 3)
    expect(computeRightCols(steps)).toEqual([0, 1, 2])
  })

  it('144 ÷ 12 = 12 → two-digit lead skips first column', () => {
    // "14" aligns to col 1, "24" aligns to col 2
    const steps = computeLongDivisionSteps(144, 12)
    expect(computeRightCols(steps)).toEqual([1, 2])
  })

  it('306 ÷ 3 = 102 → zero-digit step still advances one column', () => {
    const steps = computeLongDivisionSteps(306, 3)
    expect(computeRightCols(steps)).toEqual([0, 1, 2])
  })

  it('9996 ÷ 4 = 2499 → four steps align to columns 0–3', () => {
    const steps = computeLongDivisionSteps(9996, 4)
    expect(computeRightCols(steps)).toEqual([0, 1, 2, 3])
  })

  it('last rightCol is always dividendLength - 1', () => {
    const cases = [
      [657, 3],
      [306, 3],
      [144, 12],
      [9999, 9],
    ] as const
    for (const [dividend, divisor] of cases) {
      const steps = computeLongDivisionSteps(dividend, divisor)
      const cols = computeRightCols(steps)
      expect(cols.at(-1)).toBe(String(dividend).length - 1)
    }
  })
})

// ─── validateQuotientDigit ────────────────────────────────────────────────────

describe('validateQuotientDigit', () => {
  const step = { workingNumber: 27, quotientDigit: 9, product: 27, remainder: 0 }

  it('accepts the correct digit', () => {
    expect(validateQuotientDigit(9, step)).toEqual({ valid: true })
  })

  it('rejects an incorrect digit', () => {
    const result = validateQuotientDigit(8, step)
    expect(result.valid).toBe(false)
  })

  it('rejects digits out of range', () => {
    expect(validateQuotientDigit(-1, step).valid).toBe(false)
    expect(validateQuotientDigit(10, step).valid).toBe(false)
  })

  it('accepts 0 as a valid quotient digit', () => {
    const zeroStep = { workingNumber: 0, quotientDigit: 0, product: 0, remainder: 0 }
    expect(validateQuotientDigit(0, zeroStep)).toEqual({ valid: true })
  })
})
