import { describe, it, expect } from 'vitest'
import {
  createGameState,
  startSession,
  recordResult,
  allResults,
  type QuestionGenerator,
  type QuestionResult,
} from './gameEngine'

// ---------------------------------------------------------------------------
// Trivial test generator: questions are just numbers, key is the number itself
// ---------------------------------------------------------------------------

interface NumQuestion {
  value: number
}

const testGenerator: QuestionGenerator<NumQuestion> = {
  questionKey: (q) => String(q.value),
  getNextQuestion: (_prev, rand) => ({ value: Math.floor(rand * 10) }),
  evaluate: (q, answer) => answer === q.value * 2,
  generateChoices: (q) => [q.value * 2, q.value * 2 + 1, q.value * 2 + 2],
  displayText: (q) => String(q.value),
}

void testGenerator

// Helper to build results quickly
function correct(value: number): QuestionResult<NumQuestion> {
  return { question: { value }, correct: true }
}
function incorrect(value: number): QuestionResult<NumQuestion> {
  return { question: { value }, correct: false }
}

void correct
void incorrect

// ---------------------------------------------------------------------------
// State Transitions
// ---------------------------------------------------------------------------

describe('createGameState', () => {
  it('returns empty state', () => {
    const state = createGameState<NumQuestion>()
    expect(state.sessions).toEqual([])
    expect(state.currentSessionId).toBeNull()
  })
})

describe('startSession', () => {
  it('creates a new session and sets it as current', () => {
    const state = startSession(createGameState<NumQuestion>(), 's1', 1000)
    expect(state.sessions).toHaveLength(1)
    expect(state.sessions[0].id).toBe('s1')
    expect(state.sessions[0].startedAt).toBe(1000)
    expect(state.sessions[0].results).toEqual([])
    expect(state.currentSessionId).toBe('s1')
  })

  it('preserves previous sessions', () => {
    let state = startSession(createGameState<NumQuestion>(), 's1', 1000)
    state = startSession(state, 's2', 2000)
    expect(state.sessions).toHaveLength(2)
    expect(state.currentSessionId).toBe('s2')
  })

  it('returns a new object (immutability)', () => {
    const before = createGameState<NumQuestion>()
    const after = startSession(before, 's1', 1000)
    expect(before).not.toBe(after)
    expect(before.sessions).toHaveLength(0)
  })
})

describe('recordResult', () => {
  it('appends a correct result to the current session', () => {
    let state = startSession(createGameState<NumQuestion>(), 's1', 1000)
    state = recordResult(state, { value: 5 }, true)
    const session = state.sessions[0]
    expect(session.results).toHaveLength(1)
    expect(session.results[0].question).toEqual({ value: 5 })
    expect(session.results[0].correct).toBe(true)
  })

  it('records an incorrect result', () => {
    let state = startSession(createGameState<NumQuestion>(), 's1', 1000)
    state = recordResult(state, { value: 7 }, false)
    expect(state.sessions[0].results[0].correct).toBe(false)
  })

  it('throws if no active session', () => {
    expect(() => {
      recordResult(createGameState<NumQuestion>(), { value: 1 }, true)
    }).toThrow('No active session')
  })

  it('only appends to the current session', () => {
    let state = startSession(createGameState<NumQuestion>(), 's1', 1000)
    state = recordResult(state, { value: 1 }, true)
    state = startSession(state, 's2', 2000)
    state = recordResult(state, { value: 2 }, true)
    expect(state.sessions[0].results).toHaveLength(1)
    expect(state.sessions[1].results).toHaveLength(1)
  })

  it('is immutable', () => {
    const state = startSession(createGameState<NumQuestion>(), 's1', 1000)
    recordResult(state, { value: 3 }, true)
    expect(state.sessions[0].results).toHaveLength(0)
  })

  it('includes durationMs when provided', () => {
    let state = startSession(createGameState<NumQuestion>(), 's1', 1000)
    state = recordResult(state, { value: 5 }, true, 1234)
    expect(state.sessions[0].results[0].durationMs).toBe(1234)
  })

  it('omits durationMs when not provided', () => {
    let state = startSession(createGameState<NumQuestion>(), 's1', 1000)
    state = recordResult(state, { value: 5 }, true)
    expect(state.sessions[0].results[0]).not.toHaveProperty('durationMs')
  })
})

describe('allResults', () => {
  it('flattens results across all sessions', () => {
    let state = startSession(createGameState<NumQuestion>(), 's1', 1000)
    state = recordResult(state, { value: 1 }, true)
    state = startSession(state, 's2', 2000)
    state = recordResult(state, { value: 2 }, true)
    state = recordResult(state, { value: 3 }, false)

    const results = allResults(state)
    expect(results).toHaveLength(3)
  })
})
