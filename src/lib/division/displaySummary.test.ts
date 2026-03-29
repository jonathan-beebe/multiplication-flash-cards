import { describe, expect, it } from 'vitest'
import { buildAreaModelSummary, buildPartialQuotientsSummary, buildLongDivisionSummary } from './displaySummary'

describe('buildAreaModelSummary', () => {
  it('describes empty state', () => {
    expect(buildAreaModelSummary([], 120, 120)).toBe('No sections placed yet. 120 to fill.')
  })

  it('describes sections with remaining', () => {
    const sections = [
      { partialQuotient: 10, area: 60 },
      { partialQuotient: 5, area: 30 },
    ]
    expect(buildAreaModelSummary(sections, 30, 120)).toBe(
      'Sections placed: 10 (area 60), 5 (area 30). Remaining: 30 of 120.',
    )
  })

  it('describes fully filled', () => {
    const sections = [{ partialQuotient: 20, area: 120 }]
    expect(buildAreaModelSummary(sections, 0, 120)).toBe('Sections placed: 20 (area 120). All 120 filled.')
  })
})

describe('buildPartialQuotientsSummary', () => {
  it('describes empty state', () => {
    expect(buildPartialQuotientsSummary([], 120, 120)).toBe('No steps yet. Starting from 120.')
  })

  it('describes steps with remaining', () => {
    const sections = [
      { partialQuotient: 10, area: 60 },
      { partialQuotient: 5, area: 30 },
    ]
    expect(buildPartialQuotientsSummary(sections, 30, 120)).toBe(
      'Steps: 120 minus 60 leaves 60 (partial quotient 10); 60 minus 30 leaves 30 (partial quotient 5). Remaining: 30.',
    )
  })

  it('describes complete with no remainder', () => {
    const sections = [{ partialQuotient: 20, area: 120 }]
    expect(buildPartialQuotientsSummary(sections, 0, 120)).toBe(
      'Steps: 120 minus 120 leaves 0 (partial quotient 20). No remainder.',
    )
  })
})

describe('buildLongDivisionSummary', () => {
  it('describes empty state', () => {
    expect(buildLongDivisionSummary([], 0, 6)).toBe('No quotient digits placed yet.')
  })

  it('describes partial progress', () => {
    const steps = [
      { workingNumber: 11, quotientDigit: 1, product: 7, remainder: 4 },
      { workingNumber: 49, quotientDigit: 7, product: 49, remainder: 0 },
    ]
    expect(buildLongDivisionSummary(steps, 1, 7)).toBe(
      'Quotient so far: 1_. Step 1: 7 into 11 is 1, subtract 7, remainder 4.',
    )
  })

  it('describes fully completed', () => {
    const steps = [
      { workingNumber: 11, quotientDigit: 1, product: 7, remainder: 4 },
      { workingNumber: 49, quotientDigit: 7, product: 49, remainder: 0 },
    ]
    expect(buildLongDivisionSummary(steps, 2, 7)).toBe(
      'Quotient so far: 17. Step 1: 7 into 11 is 1, subtract 7, remainder 4. Step 2: 7 into 49 is 7, subtract 49, remainder 0.',
    )
  })
})
