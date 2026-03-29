import type { QuestionGenerator, QuestionResult } from '../engine/gameEngine'

// Internal stats shape used for question weighting
interface QuestionStat {
  question: Question
  attempts: number
  firstTryCorrect: number
  needed_hints: number
  successRate: number
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Question {
  a: number
  b: number
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/** Canonical key for a question, normalizing factor order (smaller first). */
function questionKey(q: Question): string {
  const lo = Math.min(q.a, q.b)
  const hi = Math.max(q.a, q.b)
  return `${lo}x${hi}`
}

/** Parse a compact question key like "9x11" into a Question. */
function parseQuestionKey(key: string): Question {
  const [aStr, bStr] = key.split('x')
  return { a: Number(aStr), b: Number(bStr) }
}

/**
 * Pick the next question from the 3-12 range.
 *
 * - Avoids repeating the last question.
 * - Weights toward questions the student is struggling with.
 * - `randomValue` is a number in [0, 1) used for deterministic testing.
 */
function getNextQuestion(previousResults: readonly QuestionResult<Question>[], randomValue: number): Question {
  const MIN = 3
  const MAX = 12

  // Build the full question pool
  const pool: Question[] = []
  for (let a = MIN; a <= MAX; a++) {
    for (let b = a; b <= MAX; b++) {
      pool.push({ a, b })
    }
  }

  // Figure out the last question so we can avoid it
  const lastResult = previousResults.length > 0 ? previousResults[previousResults.length - 1] : null
  const lastKey = lastResult ? questionKey(lastResult.question) : null

  // Compute per-question stats for weighting
  const stats = computeQuestionStats(previousResults)
  const statsMap = new Map<string, QuestionStat>()
  for (const s of stats) {
    statsMap.set(questionKey(s.question), s)
  }

  // Assign weights: struggling questions get higher weight
  const weights: number[] = pool.map((q) => {
    const key = questionKey(q)
    if (key === lastKey) return 0 // never repeat immediately
    const s = statsMap.get(key)
    if (!s) return 1 // unseen question: base weight
    // Weight inversely proportional to success rate
    // successRate 1.0 → weight 1, successRate 0.0 → weight 5
    return 1 + 4 * (1 - s.successRate)
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  // If all weights are 0 (e.g., only one question ever seen), pick randomly
  if (totalWeight === 0) {
    const idx = Math.floor(randomValue * pool.length)
    const q = pool[idx]
    return randomValue < 0.5 ? q : { a: q.b, b: q.a }
  }

  let target = randomValue * totalWeight
  for (let i = 0; i < pool.length; i++) {
    target -= weights[i]
    if (target <= 0) {
      const q = pool[i]
      // Randomly present a×b or b×a
      return randomValue * totalWeight < totalWeight / 2 ? q : { a: q.b, b: q.a }
    }
  }

  // Fallback (shouldn't reach here)
  const q = pool[0]
  return q
}

/** Inline stats computation used by getNextQuestion for adaptive weighting. */
function computeQuestionStats(results: readonly QuestionResult<Question>[]): QuestionStat[] {
  const map = new Map<string, Omit<QuestionStat, 'successRate'>>()

  for (const r of results) {
    const key = questionKey(r.question)
    const entry = map.get(key) ?? {
      question: parseQuestionKey(key),
      attempts: 0,
      firstTryCorrect: 0,
      needed_hints: 0,
    }
    entry.attempts++
    if (r.correct) {
      entry.firstTryCorrect++
    } else {
      entry.needed_hints++
    }
    map.set(key, entry)
  }

  return Array.from(map.values()).map((e) => ({
    ...e,
    successRate: e.attempts === 0 ? 0 : e.firstTryCorrect / e.attempts,
  }))
}

function evaluate(question: Question, answer: number): boolean {
  return answer === question.a * question.b
}

function generateChoices(question: Question): number[] {
  const { a, b } = question
  const correct = a * b
  const choices = new Set<number>([correct])

  // Try to add adjacent answers (a × (b±1))
  const adjacentOptions = []
  if (b > 3) adjacentOptions.push(a * (b - 1))
  if (b < 12) adjacentOptions.push(a * (b + 1))

  for (const adj of adjacentOptions) {
    if (choices.size < 3 && !choices.has(adj)) {
      choices.add(adj)
    }
  }

  // Fill remaining slots with random numbers 9-144
  while (choices.size < 3) {
    const random = Math.floor(Math.random() * 136) + 9
    if (!choices.has(random)) {
      choices.add(random)
    }
  }

  // Shuffle the array (Fisher-Yates)
  const result = Array.from(choices)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function displayText(question: Question): string {
  return `${question.a} times ${question.b}`
}

export const multiplicationGenerator: QuestionGenerator<Question> = {
  questionKey,
  getNextQuestion,
  evaluate,
  generateChoices,
  displayText,
}
