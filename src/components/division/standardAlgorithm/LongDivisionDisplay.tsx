import { buildQuotientSlots, buildSubtractSlots, buildValueSlots } from './longDivisionDisplay.utils'
import { type LongDivisionStep, computeRightCols } from '@/lib/division/standardAlgorithm/longDivision'

// Shared slot style: fixed 1ch-wide inline-block.
function slot(width = 1): React.CSSProperties {
  return { display: 'inline-block', width: `${width}ch`, textAlign: 'center', flexShrink: 0 }
}

// The 2px compensation spacer aligns step rows with the border-l-2 on the dividend row.
const borderCompensation: React.CSSProperties = {
  display: 'inline-block',
  width: '2px',
  flexShrink: 0,
}

// ── Row sub-components ────────────────────────────────────────────────────────
// Each represents one horizontal row in the long division grid.

function SubtractRow({
  divW,
  divisor,
  signChar,
  slots,
}: {
  divW: number
  divisor: number
  signChar: string
  slots: string[]
}) {
  return (
    <div className="flex items-baseline">
      <span style={{ ...slot(divW), visibility: 'hidden' }}>{divisor}</span>
      <span style={borderCompensation} />
      <span style={slot(1)} className="font-semibold text-slate-600 dark:text-slate-400">
        {signChar}
      </span>
      {slots.map((c, j) => (
        <span key={j} style={slot()} className="font-semibold text-slate-600 dark:text-slate-400">
          {c}
        </span>
      ))}
    </div>
  )
}

function WorkingNumberRow({ divW, divisor, slots }: { divW: number; divisor: number; slots: string[] }) {
  return (
    <div className="flex items-baseline">
      <span style={{ ...slot(divW), visibility: 'hidden' }}>{divisor}</span>
      <span style={borderCompensation} />
      <span style={slot(1)} />
      {slots.map((c, j) => (
        <span key={j} style={slot()} className="text-text">
          {c}
        </span>
      ))}
    </div>
  )
}

function FinalRemainderRow({ divW, divisor, slots }: { divW: number; divisor: number; slots: string[] }) {
  return (
    <div className="flex items-baseline">
      <span style={{ ...slot(divW), visibility: 'hidden' }}>{divisor}</span>
      <span style={borderCompensation} />
      <span style={slot(1)} />
      {slots.map((c, j) => (
        <span key={j} style={slot()} className="font-bold text-teal-600 dark:text-teal-400">
          {c}
        </span>
      ))}
    </div>
  )
}

function StepRow({
  step,
  stepIndex,
  steps,
  rightCols,
  completedCount,
  divW,
  divisor,
  N,
}: {
  step: LongDivisionStep
  stepIndex: number
  steps: LongDivisionStep[]
  rightCols: number[]
  completedCount: number
  divW: number
  divisor: number
  N: number
}) {
  const rightCol = rightCols[stepIndex]
  const wLen = String(step.workingNumber).length
  const ruleLeft = rightCol - wLen + 1
  const { signChar, slots } = buildSubtractSlots(step.product, rightCol, N)
  const isFinalDone = completedCount === steps.length && stepIndex === steps.length - 1
  const nextStep = stepIndex < steps.length - 1 ? steps[stepIndex + 1] : null
  const nextSlots = nextStep ? buildValueSlots(nextStep.workingNumber, rightCols[stepIndex + 1], N) : null
  const finalSlots = isFinalDone ? buildValueSlots(0, rightCol, N) : null

  return (
    <div>
      <SubtractRow divW={divW} divisor={divisor} signChar={signChar} slots={slots} />
      <div
        className="border-t border-slate-400 dark:border-slate-500"
        style={{ marginLeft: `calc(${divW + 1 + ruleLeft}ch + 2px)`, width: `${wLen}ch` }}
      />
      {nextSlots && <WorkingNumberRow divW={divW} divisor={divisor} slots={nextSlots} />}
      {finalSlots && <FinalRemainderRow divW={divW} divisor={divisor} slots={finalSlots} />}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface LongDivisionDisplayProps {
  dividend: number
  divisor: number
  steps: LongDivisionStep[]
  completedCount: number
}

/**
 * Renders the standard long division bracket layout.
 *
 * Every row shares the same character-grid structure so numbers always
 * align to the same columns:
 *
 *   [divW ch: divisor label or spacer]
 *   [2px: compensates for border-l-2 on the dividend row]
 *   [1ch: sign slot (− or space)]
 *   [N × 1ch: digit slots, right-aligned to the step's rightCol]
 *
 * `buildSubtractSlots` and `buildValueSlots` place digits right-aligned
 * within the N-slot grid. Raw (unformatted) numbers are used so ch widths
 * stay accurate.
 */
export default function LongDivisionDisplay({ dividend, divisor, steps, completedCount }: LongDivisionDisplayProps) {
  const dividendStr = String(dividend)
  const N = dividendStr.length
  const divW = String(divisor).length

  // 0-based index of the rightmost dividend column consumed by each step.
  const rightCols = computeRightCols(steps)
  const quotientSlots = buildQuotientSlots(steps, rightCols, N, completedCount)

  return (
    <div
      className="font-mono tabular-nums select-none text-xl leading-snug"
      style={{ display: 'inline-block' }}
      aria-hidden="true">
      {/* ── Quotient row (above bracket) ─────────────────────────── */}
      <div className="flex items-baseline">
        <span style={{ ...slot(divW), visibility: 'hidden' }}>{divisor}</span>
        <span style={borderCompensation} />
        <span style={slot(1)} />
        {quotientSlots.map((q, i) => (
          <span
            key={i}
            style={{ ...slot(), fontWeight: 'bold' }}
            className={q.completed ? 'text-teal-600 dark:text-teal-400' : 'text-slate-300 dark:text-slate-600'}>
            {q.char}
          </span>
        ))}
      </div>

      {/* ── Dividend row (the ⟌ bracket line) ───────────────────── */}
      <div className="flex items-center">
        <span className="font-bold text-text" style={slot(divW)}>
          {divisor}
        </span>
        <div className="flex border-t-2 border-l-2 border-slate-500 dark:border-slate-400">
          <span style={slot(1)} />
          {dividendStr.split('').map((d, i) => (
            <span key={i} style={{ ...slot(), fontWeight: 'bold' }} className="text-text">
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* ── Completed step rows ───────────────────────────────────── */}
      {steps.slice(0, completedCount).map((step, i) => (
        <StepRow
          key={i}
          step={step}
          stepIndex={i}
          steps={steps}
          rightCols={rightCols}
          completedCount={completedCount}
          divW={divW}
          divisor={divisor}
          N={N}
        />
      ))}
    </div>
  )
}
