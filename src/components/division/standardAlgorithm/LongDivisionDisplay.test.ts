import { describe, it, expect } from 'vitest'
import { buildQuotientSlots, buildValueSlots, buildSubtractSlots, buildStepRows } from './longDivisionDisplay.utils'
import { computeLongDivisionSteps, computeRightCols } from '@/lib/division/standardAlgorithm/longDivision'

const NBSP = '\u00A0'

// ─── buildQuotientSlots ───────────────────────────────────────────────────────

describe('buildQuotientSlots', () => {
  it('shows underscores for all steps when none are completed', () => {
    const steps = computeLongDivisionSteps(657, 3) // quotient 219
    const rightCols = computeRightCols(steps)
    const slots = buildQuotientSlots(steps, rightCols, 3, 0)
    expect(slots.map((s) => s.char)).toEqual(['_', '_', '_'])
    expect(slots.every((s) => !s.completed)).toBe(true)
  })

  it('shows completed digits and pending underscores mid-progress', () => {
    const steps = computeLongDivisionSteps(657, 3) // quotient 219
    const rightCols = computeRightCols(steps)
    const slots = buildQuotientSlots(steps, rightCols, 3, 1)
    expect(slots.map((s) => s.char)).toEqual(['2', '_', '_'])
    expect(slots[0].completed).toBe(true)
    expect(slots[1].completed).toBe(false)
  })

  it('shows all digits when fully completed', () => {
    const steps = computeLongDivisionSteps(657, 3) // quotient 219
    const rightCols = computeRightCols(steps)
    const slots = buildQuotientSlots(steps, rightCols, 3, 3)
    expect(slots.map((s) => s.char)).toEqual(['2', '1', '9'])
    expect(slots.every((s) => s.completed)).toBe(true)
  })

  it('places digits at correct columns when divisor requires two leading digits (144 ÷ 12 = 12)', () => {
    const steps = computeLongDivisionSteps(144, 12)
    const rightCols = computeRightCols(steps)
    const slots = buildQuotientSlots(steps, rightCols, 3, 2)
    expect(slots.map((s) => s.char)).toEqual([NBSP, '1', '2'])
  })
})

// ─── buildValueSlots ──────────────────────────────────────────────────────────

describe('buildValueSlots', () => {
  it('places a single digit right-aligned to rightCol', () => {
    const slots = buildValueSlots(7, 2, 4)
    expect(slots).toEqual([NBSP, NBSP, '7', NBSP])
  })

  it('places a multi-digit number right-aligned to rightCol', () => {
    const slots = buildValueSlots(123, 3, 5)
    // rightCol=3, len=3 → starts at col 1
    expect(slots).toEqual([NBSP, '1', '2', '3', NBSP])
  })

  it('places a multi-digit value at the end of the grid', () => {
    const slots = buildValueSlots(657, 2, 3)
    expect(slots).toEqual(['6', '5', '7'])
  })

  it('handles value=0 correctly', () => {
    const slots = buildValueSlots(0, 2, 3)
    expect(slots).toEqual([NBSP, NBSP, '0'])
  })

  it('fills unoccupied slots with non-breaking spaces', () => {
    const slots = buildValueSlots(5, 0, 4)
    expect(slots).toEqual(['5', NBSP, NBSP, NBSP])
  })
})

// ─── buildSubtractSlots ───────────────────────────────────────────────────────

describe('buildSubtractSlots', () => {
  it('embeds the minus sign in the grid when space is available', () => {
    // product=27, rightCol=2, N=4 → digits at [1,2], signCol=0
    const { slots, signChar } = buildSubtractSlots(27, 2, 4)
    expect(signChar).toBe(NBSP)
    expect(slots[0]).toBe('−')
    expect(slots[1]).toBe('2')
    expect(slots[2]).toBe('7')
    expect(slots[3]).toBe(NBSP)
  })

  it('returns the minus sign as signChar when the grid is full', () => {
    // product=27, rightCol=1, N=2 → digits fill cols [0,1], signCol=-1
    const { slots, signChar } = buildSubtractSlots(27, 1, 2)
    expect(signChar).toBe('−')
    expect(slots).toEqual(['2', '7'])
  })
})

// ─── buildStepRows ────────────────────────────────────────────────────────────

describe('buildStepRows', () => {
  it('returns a single row with finalSlots set for a single-step problem (9 ÷ 3)', () => {
    const steps = computeLongDivisionSteps(9, 3) // quotient 3, one step
    const rightCols = computeRightCols(steps)
    const rows = buildStepRows(steps, rightCols, 1, 1)
    expect(rows).toHaveLength(1)
    expect(rows[0].nextSlots).toBeNull()
    expect(rows[0].finalSlots).toEqual(['0'])
    expect(rows[0].ruleLeft).toBe(0)
    expect(rows[0].ruleWidth).toBe(1)
  })

  it('includes nextSlots and omits finalSlots mid-progress (657 ÷ 3, completedCount=1)', () => {
    const steps = computeLongDivisionSteps(657, 3) // quotient 219
    const rightCols = computeRightCols(steps)
    const rows = buildStepRows(steps, rightCols, 3, 1)
    expect(rows).toHaveLength(1)
    expect(rows[0].nextSlots).toEqual([NBSP, '5', NBSP])
    expect(rows[0].finalSlots).toBeNull()
  })

  it('sets finalSlots only on the last row when fully completed (657 ÷ 3, completedCount=3)', () => {
    const steps = computeLongDivisionSteps(657, 3)
    const rightCols = computeRightCols(steps)
    const rows = buildStepRows(steps, rightCols, 3, 3)
    expect(rows).toHaveLength(3)
    expect(rows[0].finalSlots).toBeNull()
    expect(rows[1].finalSlots).toBeNull()
    expect(rows[2].finalSlots).toEqual([NBSP, NBSP, '0'])
    expect(rows[2].nextSlots).toBeNull()
  })

  it('uses signChar="−" when the minus sign spills outside the grid (27 ÷ 9)', () => {
    // product=27, rightCol=1, N=2 → signCol = -1
    const steps = computeLongDivisionSteps(27, 9)
    const rightCols = computeRightCols(steps)
    const rows = buildStepRows(steps, rightCols, 2, 1)
    expect(rows[0].signChar).toBe('−')
    expect(rows[0].subtractSlots).toEqual(['2', '7'])
  })
})
