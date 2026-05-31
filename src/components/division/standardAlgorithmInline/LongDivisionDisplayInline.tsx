import {
  computeLongDivisionSteps,
  computeRightCols,
  type LongDivisionStep,
} from '@/lib/division/standardAlgorithm/longDivision'

export interface LongDivisionDisplayInlineProps {
  dividend: number
  divisor: number
  /** How many steps have been solved, 0..steps.length. Mirrors LongDivisionDisplay's prop. */
  completedCount: number
}

// Width per dividend column. Wider than 1ch to leave breathing room for the
// superscript prefix that glues to the left of each digit.
const COL_WIDTH = '2ch'

interface ColumnData {
  digit: string
  /** Small leading prefix glued to this digit (the previous step's remainder when > 0), or null. */
  prefix: string | null
  /** True while this prefix is the one being used to solve the next quotient digit; false once consumed. */
  prefixActive: boolean
  /** Char to render above the bracket: digit when solved, '_' when this col has a step still to solve, ' ' when this col never gets a step. */
  quotientChar: string
  quotientCompleted: boolean
}

function buildColumns(
  dividendStr: string,
  steps: LongDivisionStep[],
  rightCols: number[],
  completedCount: number,
): ColumnData[] {
  const N = dividendStr.length
  const stepIndexByCol = new Map<number, number>()
  steps.forEach((_, i) => {
    stepIndexByCol.set(rightCols[i], i)
  })

  return Array.from({ length: N }, (_, col) => {
    const stepIndex = stepIndexByCol.get(col)
    const prevStepIndex = stepIndexByCol.get(col - 1)
    const prevStep = prevStepIndex !== undefined ? steps[prevStepIndex] : undefined

    // Leading "skipped" cols (e.g. col 0 of 3192 ÷ 7) get no quotient slot at all.
    const stepCompleted = stepIndex !== undefined && stepIndex < completedCount
    let quotientChar = ' '
    if (stepIndex !== undefined) {
      quotientChar = stepCompleted ? String(steps[stepIndex].quotientDigit) : '_'
    }

    // A prefix on this col is revealed once the step that produced its remainder has been solved.
    const prefixRevealed = prevStep !== undefined && prevStep.remainder > 0 && prevStepIndex! < completedCount
    const prefix = prefixRevealed ? String(prevStep!.remainder) : null
    // Active while this col's own quotient hasn't been solved yet; fades once consumed.
    const prefixActive = prefixRevealed && !stepCompleted

    return {
      digit: dividendStr[col],
      prefix,
      prefixActive,
      quotientChar,
      quotientCompleted: stepCompleted,
    }
  })
}

/**
 * Renders long division using an inline carry layout: the remainder from each
 * step is shown as a smaller prefix on the next dividend digit, instead of
 * stacked subtraction rows. The work expands horizontally inside the bracket.
 *
 * Research-only component (see RSRCH-001). No tests, no integration into the
 * StandardAlgorithmProblem flow — meant to be evaluated visually from the
 * design system.
 */
export default function LongDivisionDisplayInline({
  dividend,
  divisor,
  completedCount,
}: LongDivisionDisplayInlineProps) {
  const dividendStr = String(dividend)
  const steps = computeLongDivisionSteps(dividend, divisor)
  const rightCols = computeRightCols(steps)
  const columns = buildColumns(dividendStr, steps, rightCols, completedCount)

  return (
    <div
      className="font-mono tabular-nums select-none text-xl leading-snug inline-flex items-stretch"
      aria-hidden="true">
      <span className="font-bold text-text self-end pr-1">{divisor}</span>
      <div className="flex flex-col">
        {/* Quotient row — above the bracket line. Right-aligned so the answer
            digit sits over the right edge of its dividend digit below. */}
        <div className="flex pl-1">
          {columns.map((col, i) => (
            <span
              key={i}
              className={`inline-block text-right font-bold ${
                col.quotientCompleted ? 'text-teal-600 dark:text-teal-400' : 'text-slate-300 dark:text-slate-600'
              }`}
              style={{ width: COL_WIDTH }}>
              {col.quotientChar}
            </span>
          ))}
        </div>
        {/* Dividend row — inside the bracket. Right-aligned so prefixes glue to
            the left of each digit and digits stack vertically with the quotient. */}
        <div className="flex border-t-2 border-l-2 border-slate-500 dark:border-slate-400 pl-1 pr-1 pt-0.5">
          {columns.map((col, i) => (
            <span
              key={i}
              className="inline-flex items-start justify-end font-bold text-text"
              style={{ width: COL_WIDTH }}>
              {col.prefix && (
                <span
                  className={`text-xs leading-none text-slate-500 dark:text-slate-400 mr-px transition-opacity duration-300 ${
                    col.prefixActive ? 'opacity-100' : 'opacity-30'
                  }`}>
                  {col.prefix}
                </span>
              )}
              {col.digit}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
