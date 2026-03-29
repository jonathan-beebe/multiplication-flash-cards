import type { QuestionGenerator, QuestionResult } from '../engine/gameEngine'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubtractionQuestion {
  a: number // minuend
  b: number // subtrahend (always ≤ a so the result is non-negative)
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/** Key preserves order since subtraction is not commutative. */
function questionKey(q: SubtractionQuestion): string {
  return `${q.a}-${q.b}`
}

/**
 * Pick the next subtraction question with minuend in [aMin, aMax] and
 * subtrahend in [bMin, min(bMax, a)] so the answer is always non-negative.
 */
function getNextQuestionInRange(
  previousResults: readonly QuestionResult<SubtractionQuestion>[],
  randomValue: number,
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
): SubtractionQuestion {
  const lastResult = previousResults.length > 0 ? previousResults[previousResults.length - 1] : null
  const lastKey = lastResult ? questionKey(lastResult.question) : null

  const aRange = aMax - aMin + 1

  for (let attempt = 0; attempt < 10; attempt++) {
    const seed = (randomValue + attempt * 0.1) % 1
    const a = aMin + Math.floor(seed * aRange)
    const maxB = Math.min(bMax, a)
    const minB = Math.min(bMin, maxB)
    const bRange = maxB - minB + 1
    const b = minB + Math.floor(((seed * 9973) % 1) * bRange)
    const q: SubtractionQuestion = { a, b }
    if (questionKey(q) !== lastKey) return q
  }

  // Fallback
  const a = aMin + Math.floor(randomValue * aRange)
  return { a, b: bMin }
}

function getNextQuestion(
  previousResults: readonly QuestionResult<SubtractionQuestion>[],
  randomValue: number,
): SubtractionQuestion {
  return getNextQuestionInRange(previousResults, randomValue, 1, 9999, 2, 9999)
}

export function createSubtractionGenerator(
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
): QuestionGenerator<SubtractionQuestion> {
  return {
    questionKey,
    getNextQuestion: (results, random) => getNextQuestionInRange(results, random, aMin, aMax, bMin, bMax),
    evaluate,
    generateChoices,
    displayText,
  }
}

function evaluate(question: SubtractionQuestion, answer: number): boolean {
  return answer === question.a - question.b
}

/**
 * Generate 3 plausible multiple-choice answers.
 */
function generateChoices(question: SubtractionQuestion): number[] {
  const correct = question.a - question.b
  const choices = new Set<number>([correct])

  const offsets = [1, -1, 2, -2, 10, -10, 5, -5]
  for (const offset of offsets) {
    if (choices.size >= 3) break
    const candidate = correct + offset
    if (candidate >= 0 && !choices.has(candidate)) {
      choices.add(candidate)
    }
  }

  while (choices.size < 3) {
    const candidate = correct + choices.size * 3
    if (!choices.has(candidate)) choices.add(candidate)
  }

  const result = Array.from(choices)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function displayText(question: SubtractionQuestion): string {
  return `${question.a} minus ${question.b}`
}

export const subtractionGenerator: QuestionGenerator<SubtractionQuestion> = {
  questionKey,
  getNextQuestion,
  evaluate,
  generateChoices,
  displayText,
}
