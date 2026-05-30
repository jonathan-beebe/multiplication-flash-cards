import type { LongDivisionStep } from '@/lib/division/standardAlgorithm/longDivision'

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

/** Render-ready data for a single completed step row in the long-division grid. */
export interface StepRowData {
  signChar: string
  subtractSlots: string[]
  /** 0-based column where the subtraction rule (underline) starts. */
  ruleLeft: number
  /** Width of the subtraction rule, in `ch` units (= workingNumber digit count). */
  ruleWidth: number
  /** Bring-down row for the next step's working number, or null if this is the last completed step. */
  nextSlots: string[] | null
  /** Final-remainder row (always 0 in this app), or null unless this is the last step and the problem is fully done. */
  finalSlots: string[] | null
}

/**
 * Pre-computes the render data for each completed step row, so StepRow can
 * be a dumb renderer with no awareness of sibling steps or the full `steps`
 * and `rightCols` arrays. Returns one entry per completed step.
 */
export function buildStepRows(
  steps: LongDivisionStep[],
  rightCols: number[],
  N: number,
  completedCount: number,
): StepRowData[] {
  return steps.slice(0, completedCount).map((step, i) => {
    const rightCol = rightCols[i]
    const wLen = String(step.workingNumber).length
    const { signChar, slots } = buildSubtractSlots(step.product, rightCol, N)
    const nextStep = i < steps.length - 1 ? steps[i + 1] : null
    const nextSlots = nextStep ? buildValueSlots(nextStep.workingNumber, rightCols[i + 1], N) : null
    const isFinalDone = completedCount === steps.length && i === steps.length - 1
    const finalSlots = isFinalDone ? buildValueSlots(0, rightCol, N) : null
    return {
      signChar,
      subtractSlots: slots,
      ruleLeft: rightCol - wLen + 1,
      ruleWidth: wLen,
      nextSlots,
      finalSlots,
    }
  })
}
