import type { QuestionGenerator, QuestionResult, QuestionStats } from "./gameEngine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubtractionQuestion {
  a: number; // minuend
  b: number; // subtrahend (always ≤ a so the result is non-negative)
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/** Key preserves order since subtraction is not commutative. */
function questionKey(q: SubtractionQuestion): string {
  return `${q.a}-${q.b}`;
}

function parseQuestionKey(key: string): SubtractionQuestion {
  const idx = key.indexOf("-");
  return { a: Number(key.slice(0, idx)), b: Number(key.slice(idx + 1)) };
}

const MAX = 9999;

/**
 * Pick the next subtraction question.
 *
 * Operands are drawn randomly from [0, MAX] with b ≤ a so the answer is
 * always a non-negative integer.
 */
function getNextQuestion(
  previousResults: readonly QuestionResult<SubtractionQuestion>[],
  randomValue: number,
): SubtractionQuestion {
  const lastResult =
    previousResults.length > 0
      ? previousResults[previousResults.length - 1]
      : null;
  const lastKey = lastResult ? questionKey(lastResult.question) : null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const seed = (randomValue + attempt * 0.1) % 1;
    const hi = Math.floor(seed * (MAX + 1));
    const lo = Math.floor(((seed * 9973) % 1) * (hi + 1));
    const q: SubtractionQuestion = { a: hi, b: lo };
    if (questionKey(q) !== lastKey) return q;
  }

  // Fallback
  const a = Math.max(1, Math.floor(randomValue * MAX));
  return { a, b: a - 1 };
}

function computeQuestionStats(
  results: readonly QuestionResult<SubtractionQuestion>[],
): QuestionStats<SubtractionQuestion>[] {
  const map = new Map<
    string,
    { question: SubtractionQuestion; attempts: number; firstTryCorrect: number; needed_hints: number }
  >();

  for (const r of results) {
    const key = questionKey(r.question);
    const entry = map.get(key) ?? {
      question: parseQuestionKey(key),
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

// Keep the linter happy — computeQuestionStats is available for future use.
void computeQuestionStats;

function evaluate(question: SubtractionQuestion, answer: number): boolean {
  return answer === question.a - question.b;
}

/**
 * Generate 3 plausible multiple-choice answers.
 */
function generateChoices(question: SubtractionQuestion): number[] {
  const correct = question.a - question.b;
  const choices = new Set<number>([correct]);

  const offsets = [1, -1, 2, -2, 10, -10, 5, -5];
  for (const offset of offsets) {
    if (choices.size >= 3) break;
    const candidate = correct + offset;
    if (candidate >= 0 && !choices.has(candidate)) {
      choices.add(candidate);
    }
  }

  while (choices.size < 3) {
    const candidate = correct + choices.size * 3;
    if (!choices.has(candidate)) choices.add(candidate);
  }

  const result = Array.from(choices);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function displayText(question: SubtractionQuestion): string {
  return `${question.a} minus ${question.b}`;
}

export const subtractionGenerator: QuestionGenerator<SubtractionQuestion> = {
  storageKey: "subtraction-game-state",
  questionKey,
  parseQuestionKey,
  getNextQuestion,
  evaluate,
  generateChoices,
  displayText,
};
