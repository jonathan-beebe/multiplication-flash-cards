import { type LongDivisionStep, computeRightCols } from "@/lib/division/standardAlgorithm/longDivision";

export interface LongDivisionDisplayProps {
  dividend: number;
  divisor: number;
  steps: LongDivisionStep[];
  completedCount: number;
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
 * `buildSlots` places digits right-aligned within the N-slot grid and
 * embeds the − sign in the grid where it fits; otherwise it goes in the
 * dedicated sign slot. Raw (unformatted) numbers are used so ch widths
 * stay accurate.
 */
export default function LongDivisionDisplay({
  dividend,
  divisor,
  steps,
  completedCount,
}: LongDivisionDisplayProps) {
  const dividendStr = String(dividend);
  const N = dividendStr.length;
  const divW = String(divisor).length;

  // 0-based index of the rightmost dividend column consumed by each step.
  const rightCols = computeRightCols(steps);

  // Quotient slots: each step's digit at its rightCol position.
  const quotientSlots: { char: string; completed: boolean }[] = Array.from(
    { length: N },
    () => ({ char: "\u00A0", completed: false })
  );
  steps.forEach((s, i) => {
    quotientSlots[rightCols[i]] = {
      char: i < completedCount ? String(s.quotientDigit) : "_",
      completed: i < completedCount,
    };
  });

  // Shared slot style: fixed 1ch-wide inline-block.
  const slot = (width = 1): React.CSSProperties => ({
    display: "inline-block",
    width: `${width}ch`,
    textAlign: "center",
    flexShrink: 0,
  });

  // The 2px compensation spacer aligns step rows with the border-l-2 on the dividend row.
  const borderCompensation: React.CSSProperties = {
    display: "inline-block",
    width: "2px",
    flexShrink: 0,
  };

  return (
    <div
      className="font-mono tabular-nums select-none text-xl leading-snug"
      style={{ display: "inline-block" }}
      aria-hidden="true"
    >
      {/* ── Quotient row (above bracket) ─────────────────────────── */}
      <div className="flex items-baseline">
        <span style={{ ...slot(divW), visibility: "hidden" }}>{divisor}</span>
        <span style={borderCompensation} />
        <span style={slot(1)} />
        {quotientSlots.map((q, i) => (
          <span
            key={i}
            style={{ ...slot(), fontWeight: "bold" }}
            className={
              q.completed
                ? "text-teal-600 dark:text-teal-400"
                : "text-slate-300 dark:text-slate-600"
            }
          >
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
          {dividendStr.split("").map((d, i) => (
            <span key={i} style={{ ...slot(), fontWeight: "bold" }} className="text-text">
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* ── Completed step rows ───────────────────────────────────── */}
      {steps.slice(0, completedCount).map((step, i) => {
        const rightCol = rightCols[i];
        const wLen = String(step.workingNumber).length;
        const ruleLeft = rightCol - wLen + 1; // leftmost column of this step's working number

        const { signChar, slots } = buildSubtractSlots(step.product, rightCol, N);

        const isFinalDone = completedCount === steps.length && i === steps.length - 1;

        const nextStep = i < steps.length - 1 ? steps[i + 1] : null;
        const nextSlots = nextStep
          ? buildValueSlots(nextStep.workingNumber, rightCols[i + 1], N)
          : null;
        const finalSlots = isFinalDone ? buildValueSlots(0, rightCol, N) : null;

        return (
          <div key={i}>
            {/* Subtract row */}
            <div className="flex items-baseline">
              <span style={{ ...slot(divW), visibility: "hidden" }}>{divisor}</span>
              <span style={borderCompensation} />
              <span
                style={slot(1)}
                className="font-semibold text-slate-500 dark:text-slate-400"
              >
                {signChar}
              </span>
              {slots.map((c, j) => (
                <span
                  key={j}
                  style={slot()}
                  className="font-semibold text-slate-600 dark:text-slate-400"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* Rule — anchored to the digit grid using calc() */}
            <div
              className="border-t border-slate-400 dark:border-slate-500"
              style={{
                marginLeft: `calc(${divW + 1 + ruleLeft}ch + 2px)`,
                width: `${wLen}ch`,
              }}
            />

            {/* Next working number (remainder + brought-down digit) */}
            {nextSlots && (
              <div className="flex items-baseline">
                <span style={{ ...slot(divW), visibility: "hidden" }}>{divisor}</span>
                <span style={borderCompensation} />
                <span style={slot(1)} />
                {nextSlots.map((c, j) => (
                  <span key={j} style={slot()} className="text-text">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Final remainder (0) */}
            {finalSlots && (
              <div className="flex items-baseline">
                <span style={{ ...slot(divW), visibility: "hidden" }}>{divisor}</span>
                <span style={borderCompensation} />
                <span style={slot(1)} />
                {finalSlots.map((c, j) => (
                  <span
                    key={j}
                    style={slot()}
                    className="font-bold text-teal-600 dark:text-teal-400"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Fills N digit-slots so that `value` is right-aligned to `rightCol`.
 * Returns just the slot array — use for working-number and remainder rows.
 */
export function buildValueSlots(value: number, rightCol: number, N: number): string[] {
  const s = String(value);
  const len = s.length;
  const slots = Array<string>(N).fill("\u00A0");
  for (let j = 0; j < len; j++) {
    slots[rightCol - len + 1 + j] = s[j];
  }
  return slots;
}

/**
 * Fills N digit-slots for a subtraction row, right-aligned to `rightCol`.
 * Embeds the − sign into the grid when space allows (signCol ≥ 0);
 * otherwise returns '−' as `signChar` for the dedicated sign slot.
 */
export function buildSubtractSlots(
  product: number,
  rightCol: number,
  N: number
): { signChar: string; slots: string[] } {
  const slots = buildValueSlots(product, rightCol, N);
  const len = String(product).length;
  const signCol = rightCol - len;
  if (signCol >= 0) {
    slots[signCol] = "−";
    return { signChar: "\u00A0", slots };
  }
  return { signChar: "−", slots };
}

