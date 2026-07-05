/**
 * Build three answer choices — the correct answer plus two plausible wrong
 * answers offset from it by small amounts — shuffled into random order.
 * Candidates below zero are skipped so every choice stays plausible for
 * grade-school math.
 */
export function generateOffsetChoices(correct: number): number[] {
  const choices = new Set<number>([correct])

  const offsets = [1, -1, 2, -2, 10, -10, 5, -5]
  for (const offset of offsets) {
    if (choices.size >= 3) break
    const candidate = correct + offset
    if (candidate >= 0 && !choices.has(candidate)) {
      choices.add(candidate)
    }
  }

  // Fill any remaining slots (shouldn't happen with the offsets above)
  while (choices.size < 3) {
    const candidate = correct + choices.size * 3
    if (!choices.has(candidate)) choices.add(candidate)
  }

  // Fisher-Yates shuffle
  const result = Array.from(choices)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
