// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuestionResult<Q> {
  question: Q;
  correct: boolean;
}

export interface Session<Q> {
  id: string;
  startedAt: number;
  results: readonly QuestionResult<Q>[];
}

export interface GameState<Q> {
  sessions: readonly Session<Q>[];
  currentSessionId: string | null;
}

export interface QuestionStats<Q> {
  question: Q;
  attempts: number;
  firstTryCorrect: number;
  needed_hints: number;
  successRate: number;
}

export interface PeriodSummary {
  totalQuestions: number;
  firstTryCorrect: number;
  neededRetry: number;
  successRate: number;
}

export interface QuestionGenerator<Q> {
  questionKey(q: Q): string;
  parseQuestionKey(key: string): Q;
  getNextQuestion(previousResults: readonly QuestionResult<Q>[], randomValue: number): Q;
  evaluate(question: Q, answer: number): boolean;
  generateChoices(question: Q): number[];
  displayText(question: Q): string;
}

// ---------------------------------------------------------------------------
// State Transitions
// ---------------------------------------------------------------------------

/** Create an empty initial game state. */
export function createGameState<Q>(): GameState<Q> {
  return { sessions: [], currentSessionId: null };
}

/** Start a new session and set it as current. */
export function startSession<Q>(
  state: GameState<Q>,
  id: string,
  now: number,
): GameState<Q> {
  const session: Session<Q> = { id, startedAt: now, results: [] };
  return {
    sessions: [...state.sessions, session],
    currentSessionId: id,
  };
}

/** Record a question result in the current session. */
export function recordResult<Q>(
  state: GameState<Q>,
  question: Q,
  correct: boolean,
): GameState<Q> {
  if (state.currentSessionId === null) {
    throw new Error("No active session");
  }

  const result: QuestionResult<Q> = { question, correct };

  return {
    ...state,
    sessions: state.sessions.map((s) =>
      s.id === state.currentSessionId
        ? { ...s, results: [...s.results, result] }
        : s,
    ),
  };
}

// ---------------------------------------------------------------------------
// Queries / Derived Data
// ---------------------------------------------------------------------------

/** Get the current active session, or null. */
export function getCurrentSession<Q>(state: GameState<Q>): Session<Q> | null {
  if (state.currentSessionId === null) return null;
  return (
    state.sessions.find((s) => s.id === state.currentSessionId) ?? null
  );
}

/** Summarize any list of question results into a PeriodSummary. */
export function summarize<Q>(results: readonly QuestionResult<Q>[]): PeriodSummary {
  const totalQuestions = results.length;
  const firstTryCorrect = results.filter((r) => r.correct).length;
  const neededRetry = totalQuestions - firstTryCorrect;
  return {
    totalQuestions,
    firstTryCorrect,
    neededRetry,
    successRate: totalQuestions === 0 ? 0 : firstTryCorrect / totalQuestions,
  };
}

/** Summary for a single session. */
export function sessionSummary<Q>(session: Session<Q>): PeriodSummary {
  return summarize(session.results);
}

/** Convert epoch milliseconds to "YYYY-MM-DD". */
export function toDateStr(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Summary for all sessions that started on a given "YYYY-MM-DD" day. */
export function daySummary<Q>(state: GameState<Q>, dayStr: string): PeriodSummary {
  const results = state.sessions
    .filter((s) => toDateStr(s.startedAt) === dayStr)
    .flatMap((s) => s.results);
  return summarize(results);
}

/** Compute per-question stats from any list of results. */
export function questionStats<Q>(
  results: readonly QuestionResult<Q>[],
  generator: QuestionGenerator<Q>,
): QuestionStats<Q>[] {
  const map = new Map<
    string,
    { question: Q; attempts: number; firstTryCorrect: number; needed_hints: number }
  >();

  for (const r of results) {
    const key = generator.questionKey(r.question);
    const entry = map.get(key) ?? {
      question: generator.parseQuestionKey(key),
      attempts: 0,
      firstTryCorrect: 0,
      needed_hints: 0,
    };
    entry.attempts++;
    if (r.correct) {
      entry.firstTryCorrect++;
    } else {
      entry.needed_hints++;
    }
    map.set(key, entry);
  }

  return Array.from(map.values()).map((e) => ({
    ...e,
    successRate: e.attempts === 0 ? 0 : e.firstTryCorrect / e.attempts,
  }));
}

/**
 * Return the questions the student struggles with most, sorted by success rate
 * (ascending). Optionally filter by minimum attempts and limit the count.
 */
export function strugglingQuestions<Q>(
  results: readonly QuestionResult<Q>[],
  generator: QuestionGenerator<Q>,
  minAttempts: number = 1,
  limit?: number,
): QuestionStats<Q>[] {
  const stats = questionStats(results, generator)
    .filter((s) => s.attempts >= minAttempts)
    .sort((a, b) => a.successRate - b.successRate);
  return limit !== undefined ? stats.slice(0, limit) : stats;
}

/** Flatten all results across all sessions. */
export function allResults<Q>(state: GameState<Q>): readonly QuestionResult<Q>[] {
  return state.sessions.flatMap((s) => s.results);
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/** Compact session: i=id, t=startedAt timestamp, r=right (correct) keys, w=wrong keys */
interface SerializedSession {
  i: string;
  t: number;
  r: string[];
  w: string[];
}

interface SerializedState {
  v: 2;
  sessions: SerializedSession[];
  currentSessionId: string | null;
}

/** Serialize game state to a compact JSON string. */
export function serializeGameState<Q>(
  state: GameState<Q>,
  generator: QuestionGenerator<Q>,
): string {
  const serialized: SerializedState = {
    v: 2,
    sessions: state.sessions.map((s) => {
      const right: string[] = [];
      const wrong: string[] = [];
      for (const r of s.results) {
        const key = generator.questionKey(r.question);
        if (r.correct) {
          right.push(key);
        } else {
          wrong.push(key);
        }
      }
      return { i: s.id, t: s.startedAt, r: right, w: wrong };
    }),
    currentSessionId: state.currentSessionId,
  };
  return JSON.stringify(serialized);
}

/** Deserialize a JSON string back to GameState, falling back to empty state on invalid data. */
export function deserializeGameState<Q>(
  json: string,
  generator: QuestionGenerator<Q>,
): GameState<Q> {
  try {
    const parsed: SerializedState = JSON.parse(json);
    if (!parsed || parsed.v !== 2 || !Array.isArray(parsed.sessions)) {
      return createGameState<Q>();
    }

    return {
      sessions: parsed.sessions.map((s) => ({
        id: s.i,
        startedAt: s.t,
        results: [
          ...s.r.map((key) => ({ question: generator.parseQuestionKey(key), correct: true })),
          ...s.w.map((key) => ({ question: generator.parseQuestionKey(key), correct: false })),
        ],
      })),
      currentSessionId: parsed.currentSessionId,
    };
  } catch {
    return createGameState<Q>();
  }
}

const STORAGE_KEY = "multiplication-game-state";

/** Load game state from localStorage, returning empty state if unavailable. */
export function loadGameState<Q>(generator: QuestionGenerator<Q>): GameState<Q> {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return createGameState<Q>();
    return deserializeGameState(json, generator);
  } catch {
    return createGameState<Q>();
  }
}

/** Save game state to localStorage. */
export function saveGameState<Q>(
  state: GameState<Q>,
  generator: QuestionGenerator<Q>,
): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeGameState(state, generator));
  } catch {
    // Silently ignore storage errors (quota exceeded, private browsing, etc.)
  }
}
