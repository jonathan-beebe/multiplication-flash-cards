// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuestionResult<Q> {
  question: Q
  correct: boolean
  durationMs?: number
}

export interface Session<Q> {
  id: string
  startedAt: number
  results: readonly QuestionResult<Q>[]
}

export interface GameState<Q> {
  sessions: readonly Session<Q>[]
  currentSessionId: string | null
}

export interface QuestionGenerator<Q> {
  questionKey(q: Q): string
  getNextQuestion(previousResults: readonly QuestionResult<Q>[], randomValue: number): Q
  evaluate(question: Q, answer: number): boolean
  generateChoices(question: Q): number[]
  displayText(question: Q): string
}

// ---------------------------------------------------------------------------
// State Transitions
// ---------------------------------------------------------------------------

/** Create an empty initial game state. */
export function createGameState<Q>(): GameState<Q> {
  return { sessions: [], currentSessionId: null }
}

/** Start a new session and set it as current. */
export function startSession<Q>(state: GameState<Q>, id: string, now: number): GameState<Q> {
  const session: Session<Q> = { id, startedAt: now, results: [] }
  return {
    sessions: [...state.sessions, session],
    currentSessionId: id,
  }
}

/** Record a question result in the current session. */
export function recordResult<Q>(state: GameState<Q>, question: Q, correct: boolean, durationMs?: number): GameState<Q> {
  if (state.currentSessionId === null) {
    throw new Error('No active session')
  }

  const result: QuestionResult<Q> = { question, correct, ...(durationMs !== undefined && { durationMs }) }

  return {
    ...state,
    sessions: state.sessions.map((s) =>
      s.id === state.currentSessionId ? { ...s, results: [...s.results, result] } : s,
    ),
  }
}

/** Flatten all results across all sessions. */
export function allResults<Q>(state: GameState<Q>): readonly QuestionResult<Q>[] {
  return state.sessions.flatMap((s) => s.results)
}
