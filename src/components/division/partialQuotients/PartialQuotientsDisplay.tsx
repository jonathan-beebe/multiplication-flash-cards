import type { Section } from '@/lib/division/areaMode/divisionProblem'

export interface PartialQuotientsDisplayProps {
  dividend: number
  divisor: number
  /** Used only to size the partial-quotient column; never rendered directly. */
  quotient: number
  sections: Section[]
  showTotal: boolean
}

/**
 * Renders the partial quotients stacked-subtraction layout.
 *
 * Grid structure — every content row shares three fixed-width ch slots so
 * numbers always right-align to the same column:
 *
 *   [sign: 1ch] [number: numW ch, right-aligned] [pq: pqW ch, right-aligned]
 *
 * A continuous border-l-2 runs down the left of all content rows;
 * border-t-2 appears only on the header row, forming the traditional ⟌ bracket.
 * Raw (unformatted) numbers are used inside the grid so ch units stay accurate.
 */
export default function PartialQuotientsDisplay({
  dividend,
  divisor,
  quotient,
  sections,
  showTotal,
}: PartialQuotientsDisplayProps) {
  // Column widths in ch units — use raw digit count, not toLocaleString,
  // so widths stay accurate in the monospace grid.
  const numW = String(dividend).length
  const pqW = Math.max(String(quotient).length, 2)

  // Pre-compute running remainders after each section.
  const remainders: number[] = []
  let running = dividend
  for (const s of sections) {
    running -= s.area
    remainders.push(running)
  }

  const total = sections.reduce((acc, s) => acc + s.partialQuotient, 0)

  // Shared slot styles
  const signSlot: React.CSSProperties = {
    display: 'inline-block',
    width: '1ch',
    flexShrink: 0,
    textAlign: 'center',
  }
  const numSlot: React.CSSProperties = {
    display: 'inline-block',
    width: `${numW}ch`,
    textAlign: 'right',
    flexShrink: 0,
  }
  const pqSlot: React.CSSProperties = {
    display: 'inline-block',
    width: `calc(${pqW}ch + 1.5ch)`,
    textAlign: 'right',
    flexShrink: 0,
    paddingLeft: '1.5ch',
  }

  return (
    <div
      className="font-mono tabular-nums select-none text-lg leading-snug mx-auto"
      style={{ width: 'fit-content' }}
      aria-hidden="true">
      {/* Outer row: divisor label + bracketed content area */}
      <div className="flex items-stretch">
        {/* Divisor label — sits outside the bracket */}
        <span className="font-bold text-text self-end pb-0.5 pr-0.5" style={{ flexShrink: 0 }}>
          {divisor}
        </span>

        {/* Content area: continuous border-l-2; header row gets border-t-2 too */}
        <div className="border-l-2 border-slate-500 dark:border-slate-400 flex flex-col">
          {/* ── Header row: dividend ─────────────────────────────── */}
          <div
            className="flex items-center border-t-2 border-slate-500 dark:border-slate-400"
            style={{ paddingLeft: '0.25rem' }}>
            <span style={signSlot} />
            <span className="font-bold text-text" style={numSlot}>
              {dividend}
            </span>
          </div>

          {/* ── Subtraction steps ─────────────────────────────────── */}
          {sections.map((section, i) => {
            const rem = remainders[i]
            return (
              <div key={i} className="flex flex-col" style={{ paddingLeft: '0.25rem' }}>
                {/* Subtract row */}
                <div className="flex items-center text-slate-600 dark:text-slate-400 font-semibold">
                  <span style={signSlot}>−</span>
                  <span style={numSlot}>{section.area}</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400" style={pqSlot}>
                    {section.partialQuotient}
                  </span>
                </div>

                {/* Rule — spans sign + number slots only */}
                <div
                  className="border-t border-slate-400 dark:border-slate-500"
                  style={{ width: `calc(1ch + ${numW}ch)` }}
                />

                {/* Remainder */}
                <div
                  className={`flex items-center font-bold ${
                    rem === 0 ? 'text-teal-600 dark:text-teal-400' : 'text-text'
                  }`}>
                  <span style={signSlot} />
                  <span style={numSlot}>{rem}</span>
                </div>
              </div>
            )
          })}

          {/* ── Total row (when done, multiple sections) ──────────── */}
          {showTotal && (
            <div style={{ paddingLeft: '0.25rem' }}>
              {/* Double rule across sign + number + pq */}
              <div
                className="border-t-2 border-slate-500 dark:border-slate-400"
                style={{ width: `calc(1ch + ${numW}ch + 1.5ch + ${pqW}ch)` }}
              />
              <div className="flex items-center">
                <span
                  style={{
                    display: 'inline-block',
                    width: `calc(1ch + ${numW}ch)`,
                    textAlign: 'right',
                    flexShrink: 0,
                  }}>
                  <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.75em' }}>
                    sum
                  </span>
                </span>
                <span className="font-bold text-teal-600 dark:text-teal-400" style={pqSlot}>
                  {total}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
