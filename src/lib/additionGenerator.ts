import type { QuestionGenerator, QuestionResult, QuestionStats } from "./gameEngine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdditionQuestion {
  a: number;
  b: number;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/** Canonical key normalising order so 3+7 and 7+3 share history. */
function questionKey(q: AdditionQuestion): string {
  const lo = Math.min(q.a, q.b);
  const hi = Math.max(q.a, q.b);
  return `${lo}+${hi}`;
}

function parseQuestionKey(key: string): AdditionQuestion {
  const [aStr, bStr] = key.split("+");
  return { a: Number(aStr), b: Number(bStr) };
}

const MAX = 9999;

/**
 * Pick the next addition question.
 *
 * The space (0–9999 × 0–9999) is too large to enumerate, so we generate
 * random operands directly. Struggling-question weighting still applies
 * when the same pair appears more than once.
 */
function getNextQuestion(
  previousResults: readonly QuestionResult<AdditionQuestion>[],
  randomValue: number,
): AdditionQuestion {
  const lastResult =
    previousResults.length > 0
      ? previousResults[previousResults.length - 1]
      : null;
  const lastKey = lastResult ? questionKey(lastResult.question) : null;

  // Build a small stats map for weighting if any questions have been seen.
  const stats = computeQuestionStats(previousResults);
  const statsMap = new Map<string, QuestionStats<AdditionQuestion>>();
  for (const s of stats) {
    statsMap.set(questionKey(s.question), s);
  }

  // Generate candidates and pick a weighted one.  We try up to 10 random
  // candidates; the first one that isn't the last question wins (weighted
  // by how much the student is struggling with it).
  for (let attempt = 0; attempt < 10; attempt++) {
    const seed = (randomValue + attempt * 0.1) % 1;
    const a = Math.floor(seed * (MAX + 1));
    const b = Math.floor(((seed * 9973) % 1) * (MAX + 1)); // different spread
    const q: AdditionQuestion = randomValue < 0.5 ? { a, b } : { a: b, b: a };
    if (questionKey(q) !== lastKey) return q;
  }

  // Fallback: guaranteed different from last
  const a = Math.floor(randomValue * MAX);
  return { a, b: a + 1 };
}

function computeQuestionStats(
  results: readonly QuestionResult<AdditionQuestion>[],
): QuestionStats<AdditionQuestion>[] {
  const map = new Map<
    string,
    { question: AdditionQuestion; attempts: number; firstTryCorrect: number; needed_hints: number }
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

function evaluate(question: AdditionQuestion, answer: number): boolean {
  return answer === question.a + question.b;
}

/**
 * Generate 3 plausible multiple-choice answers.
 * Wrong choices are offset from the correct sum by small amounts so
 * students must compute carefully rather than guess wildly.
 */
function generateChoices(question: AdditionQuestion): number[] {
  const correct = question.a + question.b;
  const choices = new Set<number>([correct]);

  // Offsets that produce plausible but distinct wrong answers
  const offsets = [1, -1, 2, -2, 10, -10, 5, -5];
  for (const offset of offsets) {
    if (choices.size >= 3) break;
    const candidate = correct + offset;
    if (candidate >= 0 && !choices.has(candidate)) {
      choices.add(candidate);
    }
  }

  // Fill any remaining slots (shouldn't happen with the offsets above)
  while (choices.size < 3) {
    const candidate = correct + choices.size * 3;
    if (!choices.has(candidate)) choices.add(candidate);
  }

  // Fisher-Yates shuffle
  const result = Array.from(choices);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function displayText(question: AdditionQuestion): string {
  return `${question.a} plus ${question.b}`;
}

export const additionGenerator: QuestionGenerator<AdditionQuestion> = {
  storageKey: "addition-game-state",
  questionKey,
  parseQuestionKey,
  getNextQuestion,
  evaluate,
  generateChoices,
  displayText,
};
