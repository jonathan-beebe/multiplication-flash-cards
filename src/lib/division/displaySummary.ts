import type { Section } from '@/lib/division/areaMode/divisionProblem'
import type { LongDivisionStep } from '@/lib/division/standardAlgorithm/longDivision'

/**
 * Builds a screen-reader summary for the area model rectangle display.
 */
export function buildAreaModelSummary(sections: Section[], remaining: number, dividend: number): string {
  if (sections.length === 0) {
    return `No sections placed yet. ${dividend} to fill.`
  }

  const parts = sections.map((s) => `${s.partialQuotient} (area ${s.area})`)

  const placed = `Sections placed: ${parts.join(', ')}.`
  const rem = remaining > 0 ? ` Remaining: ${remaining} of ${dividend}.` : ` All ${dividend} filled.`

  return placed + rem
}

/**
 * Builds a screen-reader summary for the partial quotients subtraction display.
 */
export function buildPartialQuotientsSummary(sections: Section[], remaining: number, dividend: number): string {
  if (sections.length === 0) {
    return `No steps yet. Starting from ${dividend}.`
  }

  let current = dividend
  const stepDescs = sections.map((s) => {
    const before = current
    current = before - s.area
    return `${before} minus ${s.area} leaves ${current} (partial quotient ${s.partialQuotient})`
  })

  const steps = `Steps: ${stepDescs.join('; ')}.`
  const rem = remaining > 0 ? ` Remaining: ${remaining}.` : ' No remainder.'

  return steps + rem
}

/**
 * Builds a screen-reader summary for the long division bracket display.
 */
export function buildLongDivisionSummary(steps: LongDivisionStep[], completedCount: number, divisor: number): string {
  if (completedCount === 0) {
    return 'No quotient digits placed yet.'
  }

  const quotientDigits = steps.map((s, i) => (i < completedCount ? String(s.quotientDigit) : '_')).join('')

  const stepDescs = steps
    .slice(0, completedCount)
    .map(
      (s, i) =>
        `Step ${i + 1}: ${divisor} into ${s.workingNumber} is ${s.quotientDigit}, subtract ${s.product}, remainder ${s.remainder}`,
    )

  return `Quotient so far: ${quotientDigits}. ${stepDescs.join('. ')}.`
}
