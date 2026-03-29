import { describe, it, expect } from 'vitest'
import { createAreaModelSession, areaModelSessionReducer } from './areaModelState'
import type { AreaModelSessionState } from './areaModelState'

// A fixed problem for deterministic tests: 84 ÷ 4 = 21
const PROBLEM = { dividend: 84, divisor: 4, quotient: 21 }

function makeSession(overrides: Partial<AreaModelSessionState> = {}): AreaModelSessionState {
  return {
    problem: PROBLEM,
    sections: [],
    remaining: 84,
    phase: 'building',
    announcement: '',
    ...overrides,
  }
}

// ── createAreaModelSession ────────────────────────────────────────────────────

describe('createAreaModelSession', () => {
  it('starts in building phase with no sections, empty announcement', () => {
    const session = createAreaModelSession(1)
    expect(session.phase).toBe('building')
    expect(session.sections).toEqual([])
    expect(session.announcement).toBe('')
  })

  it('sets remaining to the full dividend', () => {
    const session = createAreaModelSession(1)
    expect(session.remaining).toBe(session.problem.dividend)
  })

  it('generates a valid problem (dividend = divisor × quotient)', () => {
    const session = createAreaModelSession(1)
    expect(session.problem.dividend).toBe(session.problem.divisor * session.problem.quotient)
  })
})

// ── SUBMIT_BUILDING — remainder > 0 ──────────────────────────────────────────

describe('areaModelSessionReducer / SUBMIT_BUILDING — partial fill', () => {
  it('adds a section and stays in building phase', () => {
    const state = makeSession()
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_BUILDING', partialQuotient: 10 })

    expect(next.phase).toBe('building')
    expect(next.sections).toEqual([{ partialQuotient: 10, area: 40 }])
  })

  it('decrements remaining by the placed area', () => {
    const state = makeSession()
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_BUILDING', partialQuotient: 10 })

    expect(next.remaining).toBe(44) // 84 - 40
  })

  it('announces the placed area and remaining', () => {
    const state = makeSession()
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_BUILDING', partialQuotient: 10 })

    expect(next.announcement).toContain('40') // area placed
    expect(next.announcement).toContain('44') // remaining
    expect(next.announcement).toMatch(/placed/i)
    expect(next.announcement).toMatch(/remaining/i)
  })

  it('accumulates multiple sections correctly', () => {
    const state = makeSession({
      sections: [{ partialQuotient: 10, area: 40 }],
      remaining: 44,
    })
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_BUILDING', partialQuotient: 10 })

    expect(next.sections).toHaveLength(2)
    expect(next.remaining).toBe(4) // 44 - 40
  })
})

// ── SUBMIT_BUILDING — rectangle complete → summing ───────────────────────────

describe('areaModelSessionReducer / SUBMIT_BUILDING — fills remaining, multiple sections', () => {
  it('transitions to summing phase', () => {
    const state = makeSession({
      sections: [{ partialQuotient: 10, area: 40 }],
      remaining: 44,
    })
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_BUILDING', partialQuotient: 11 })

    expect(next.phase).toBe('summing')
    expect(next.remaining).toBe(0)
    expect(next.sections).toHaveLength(2)
  })

  it('announces rectangle complete and prompts to add partial quotients', () => {
    const state = makeSession({
      sections: [{ partialQuotient: 10, area: 40 }],
      remaining: 44,
    })
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_BUILDING', partialQuotient: 11 })

    expect(next.announcement).toMatch(/rectangle complete/i)
    expect(next.announcement).toMatch(/add up the partial quotients/i)
  })
})

// ── SUBMIT_BUILDING — single section covers full dividend → done ──────────────

describe('areaModelSessionReducer / SUBMIT_BUILDING — single section, full fill', () => {
  it('transitions directly to done phase (skips summing)', () => {
    const state = makeSession()
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_BUILDING', partialQuotient: 21 })

    expect(next.phase).toBe('done')
    expect(next.remaining).toBe(0)
    expect(next.sections).toHaveLength(1)
  })

  it('announces the correct answer', () => {
    const state = makeSession()
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_BUILDING', partialQuotient: 21 })

    expect(next.announcement).toMatch(/correct/i)
    expect(next.announcement).toContain('84')
    expect(next.announcement).toContain('21')
  })
})

// ── SUBMIT_SUMMING ────────────────────────────────────────────────────────────

describe('areaModelSessionReducer / SUBMIT_SUMMING', () => {
  it('transitions to done phase', () => {
    const state = makeSession({
      phase: 'summing',
      sections: [
        { partialQuotient: 10, area: 40 },
        { partialQuotient: 11, area: 44 },
      ],
      remaining: 0,
    })
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_SUMMING' })

    expect(next.phase).toBe('done')
  })

  it('announces the correct answer with dividend and quotient', () => {
    const state = makeSession({
      phase: 'summing',
      sections: [
        { partialQuotient: 10, area: 40 },
        { partialQuotient: 11, area: 44 },
      ],
      remaining: 0,
    })
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_SUMMING' })

    expect(next.announcement).toMatch(/correct/i)
    expect(next.announcement).toContain('84')
    expect(next.announcement).toContain('21')
  })

  it('preserves sections and problem', () => {
    const sections = [
      { partialQuotient: 10, area: 40 },
      { partialQuotient: 11, area: 44 },
    ]
    const state = makeSession({ phase: 'summing', sections, remaining: 0 })
    const next = areaModelSessionReducer(state, { type: 'SUBMIT_SUMMING' })

    expect(next.sections).toEqual(sections)
    expect(next.problem).toEqual(PROBLEM)
  })
})

// ── NEXT ──────────────────────────────────────────────────────────────────────

describe('areaModelSessionReducer / NEXT', () => {
  it('resets to building phase with no sections', () => {
    const state = makeSession({
      phase: 'done',
      sections: [{ partialQuotient: 21, area: 84 }],
      remaining: 0,
      announcement: 'Correct!',
    })
    const next = areaModelSessionReducer(state, { type: 'NEXT', level: 1 })

    expect(next.phase).toBe('building')
    expect(next.sections).toEqual([])
    expect(next.announcement).toBe('')
  })

  it("sets remaining to the new problem's full dividend", () => {
    const state = makeSession({ phase: 'done' })
    const next = areaModelSessionReducer(state, { type: 'NEXT', level: 1 })

    expect(next.remaining).toBe(next.problem.dividend)
  })

  it('generates a valid new problem', () => {
    const state = makeSession({ phase: 'done' })
    const next = areaModelSessionReducer(state, { type: 'NEXT', level: 1 })

    expect(next.problem.dividend).toBe(next.problem.divisor * next.problem.quotient)
  })
})
