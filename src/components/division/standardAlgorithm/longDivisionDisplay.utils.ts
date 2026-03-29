import { type LongDivisionStep, computeRightCols } from '@/lib/division/standardAlgorithm/longDivision'

export type { LongDivisionStep }
export { computeRightCols }

/**
 * Builds the N quotient slots shown above the bracket. Each step's digit
 * is placed at its rightCol; completed steps show the digit, pending steps
 * show "_", and unused columns show a non-breaking space.
 */
export function buildQuotientSlots(
  steps: LongDivisionStep[],
  rightCols: number[],
  N: number,
  completedCount: number,
): { char: string; completed: boolean }[] {
  const slots: { char: string; completed: boolean }[] = Array.from({ length: N }, () => ({
    char: '\u00A0',
    completed: false,
  }))
  steps.forEach((s, i) => {
    slots[rightCols[i]] = {
      char: i < completedCount ? String(s.quotientDigit) : '_',
      completed: i < completedCount,
    }
  })
  return slots
}

/**
 * Fills N digit-slots so that `value` is right-aligned to `rightCol`.
 * Returns just the slot array — use for working-number and remainder rows.
 */
export function buildValueSlots(value: number, rightCol: number, N: number): string[] {
  const s = String(value)
  const len = s.length
  const slots = Array<string>(N).fill('\u00A0')
  for (let j = 0; j < len; j++) {
    slots[rightCol - len + 1 + j] = s[j]
  }
  return slots
}

/**
 * Fills N digit-slots for a subtraction row, right-aligned to `rightCol`.
 * Embeds the − sign into the grid when space allows (signCol ≥ 0);
 * otherwise returns '−' as `signChar` for the dedicated sign slot.
 */
export function buildSubtractSlots(
  product: number,
  rightCol: number,
  N: number,
): { signChar: string; slots: string[] } {
  const slots = buildValueSlots(product, rightCol, N)
  const len = String(product).length
  const signCol = rightCol - len
  if (signCol >= 0) {
    slots[signCol] = '−'
    return { signChar: '\u00A0', slots }
  }
  return { signChar: '−', slots }
}
