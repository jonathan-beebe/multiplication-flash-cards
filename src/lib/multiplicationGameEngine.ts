// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Question {
  a: number;
  b: number;
}

export interface QuestionResult {
  question: Question;
  wrongAnswers: readonly number[];
  timestamp: number;
}

export interface Session {
  id: string;
  startedAt: number;
  results: readonly QuestionResult[];
}

export interface GameState {
  sessions: readonly Session[];
  currentSessionId: string | null;
}

export interface QuestionStats {
  question: Question;
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

// ---------------------------------------------------------------------------
// Game Space
// ---------------------------------------------------------------------------

/** Canonical key for a question, normalizing factor order (smaller first). */
export function questionKey(q: Question): string {
  const lo = Math.min(q.a, q.b);
  const hi = Math.max(q.a, q.b);
  return `${lo}x${hi}`;
}

/**
 * Pick the next question from the 3-12 range.
 *
 * - Avoids repeating the last question.
 * - Weights toward questions the student is struggling with.
 * - `randomValue` is a number in [0, 1) used for deterministic testing.
 */
export function getNextQuestion(
  previousResults: readonly QuestionResult[],
  randomValue: number,
): Question {
  const MIN = 3;
  const MAX = 12;

  // Build the full question pool
  const pool: Question[] = [];
  for (let a = MIN; a <= MAX; a++) {
    for (let b = a; b <= MAX; b++) {
      pool.push({ a, b });
    }
  }

  // Figure out the last question so we can avoid it
  const lastResult =
    previousResults.length > 0
      ? previousResults[previousResults.length - 1]
      : null;
  const lastKey = lastResult ? questionKey(lastResult.question) : null;

  // Compute per-question stats for weighting
  const stats = questionStats(previousResults);
  const statsMap = new Map<string, QuestionStats>();
  for (const s of stats) {
    statsMap.set(questionKey(s.question), s);
  }

  // Assign weights: struggling questions get higher weight
  const weights: number[] = pool.map((q) => {
    const key = questionKey(q);
    if (key === lastKey) return 0; // never repeat immediately
    const s = statsMap.get(key);
    if (!s) return 1; // unseen question: base weight
    // Weight inversely proportional to success rate
    // successRate 1.0 → weight 1, successRate 0.0 → weight 5
    return 1 + 4 * (1 - s.successRate);
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // If all weights are 0 (e.g., only one question ever seen), pick randomly
  if (totalWeight === 0) {
    const idx = Math.floor(randomValue * pool.length);
    const q = pool[idx];
    return randomValue < 0.5 ? q : { a: q.b, b: q.a };
  }

  let target = randomValue * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    target -= weights[i];
    if (target <= 0) {
      const q = pool[i];
      // Randomly present a×b or b×a
      return randomValue * totalWeight < totalWeight / 2
        ? q
        : { a: q.b, b: q.a };
    }
  }

  // Fallback (shouldn't reach here)
  const q = pool[0];
  return q;
}

// ---------------------------------------------------------------------------
// State Transitions
// ---------------------------------------------------------------------------

/** Create an empty initial game state. */
export function createGameState(): GameState {
  return { sessions: [], currentSessionId: null };
}

/** Start a new session and set it as current. */
export function startSession(
  state: GameState,
  id: string,
  now: number,
): GameState {
  const session: Session = { id, startedAt: now, results: [] };
  return {
    sessions: [...state.sessions, session],
    currentSessionId: id,
  };
}

/** Record a question result in the current session. */
export function recordResult(
  state: GameState,
  question: Question,
  wrongAnswers: readonly number[],
  now: number,
): GameState {
  if (state.currentSessionId === null) {
    throw new Error("No active session");
  }

  const result: QuestionResult = { question, wrongAnswers, timestamp: now };

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
export function getCurrentSession(state: GameState): Session | null {
  if (state.currentSessionId === null) return null;
  return (
    state.sessions.find((s) => s.id === state.currentSessionId) ?? null
  );
}

/** Summarize any list of question results into a PeriodSummary. */
export function summarize(results: readonly QuestionResult[]): PeriodSummary {
  const totalQuestions = results.length;
  const firstTryCorrect = results.filter(
    (r) => r.wrongAnswers.length === 0,
  ).length;
  const neededRetry = totalQuestions - firstTryCorrect;
  return {
    totalQuestions,
    firstTryCorrect,
    neededRetry,
    successRate: totalQuestions === 0 ? 0 : firstTryCorrect / totalQuestions,
  };
}

/** Summary for a single session. */
export function sessionSummary(session: Session): PeriodSummary {
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
export function daySummary(state: GameState, dayStr: string): PeriodSummary {
  const results = state.sessions
    .filter((s) => toDateStr(s.startedAt) === dayStr)
    .flatMap((s) => s.results);
  return summarize(results);
}

/** Compute per-question stats from any list of results. */
export function questionStats(
  results: readonly QuestionResult[],
): QuestionStats[] {
  const map = new Map<
    string,
    { question: Question; attempts: number; firstTryCorrect: number; needed_hints: number }
  >();

  for (const r of results) {
    const key = questionKey(r.question);
    const entry = map.get(key) ?? {
      question: { a: Math.min(r.question.a, r.question.b), b: Math.max(r.question.a, r.question.b) },
      attempts: 0,
      firstTryCorrect: 0,
      needed_hints: 0,
    };
    entry.attempts++;
    if (r.wrongAnswers.length === 0) {
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
export function strugglingQuestions(
  results: readonly QuestionResult[],
  minAttempts: number = 1,
  limit?: number,
): QuestionStats[] {
  const stats = questionStats(results)
    .filter((s) => s.attempts >= minAttempts)
    .sort((a, b) => a.successRate - b.successRate);
  return limit !== undefined ? stats.slice(0, limit) : stats;
}

/** Flatten all results across all sessions. */
export function allResults(state: GameState): readonly QuestionResult[] {
  return state.sessions.flatMap((s) => s.results);
}
