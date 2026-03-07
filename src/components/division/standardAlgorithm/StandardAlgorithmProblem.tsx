import { useState, useRef, useEffect, useCallback } from "react";
import { generateProblem, getHelpfulFacts } from "@/lib/division/areaMode/divisionProblem";
import type { Level, Problem } from "@/lib/division/areaMode/divisionProblem";
import {
  computeLongDivisionSteps,
  validateQuotientDigit,
} from "@/lib/division/standardAlgorithm/longDivision";
import ErrorText from "@/components/atoms/ErrorText";
import PrimaryButton from "@/components/atoms/PrimaryButton";
import NumberInput from "@/components/atoms/NumberInput";
import SuccessText from "@/components/atoms/SuccessText";
import ProblemHeading from "@/components/atoms/ProblemHeading";
import type { LongDivisionStep } from "@/lib/division/standardAlgorithm/longDivision";

interface ProblemState {
  problem: Problem;
  steps: LongDivisionStep[];
  completedCount: number;
}

function createInitialState(level: Level): ProblemState {
  const problem = generateProblem(level);
  const steps = computeLongDivisionSteps(problem.dividend, problem.divisor);
  return { problem, steps, completedCount: 0 };
}

interface Props {
  level: Level;
}

export default function StandardAlgorithmProblem({ level }: Props) {
  const [state, setState] = useState<ProblemState>(() => createInitialState(level));
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const { problem, steps, completedCount } = state;
  const isDone = completedCount === steps.length;
  const currentStep = isDone ? null : steps[completedCount];

  useEffect(() => {
    if (isDone) {
      const id = setTimeout(() => nextButtonRef.current?.focus(), 50);
      return () => clearTimeout(id);
    } else {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [isDone, completedCount]);

  function triggerShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  }

  const handleSubmit = useCallback(() => {
    if (!currentStep) return;

    const value = parseInt(inputValue, 10);
    if (isNaN(value)) {
      triggerShake();
      setInputError("Enter a digit");
      inputRef.current?.focus();
      return;
    }

    const result = validateQuotientDigit(value, currentStep);
    if (!result.valid) {
      triggerShake();
      setInputError(result.error);
      inputRef.current?.focus();
      return;
    }

    const nextCompleted = completedCount + 1;
    setInputValue("");
    setInputError(null);
    setState((s) => ({ ...s, completedCount: nextCompleted }));

    if (nextCompleted === steps.length) {
      setAnnouncement(
        `Correct! ${problem.dividend.toLocaleString()} divided by ${problem.divisor} equals ${problem.quotient}.`
      );
    } else {
      setAnnouncement(
        `${value} is correct. ${currentStep.product} subtracted, ${currentStep.remainder} remaining. Bring down the next digit.`
      );
    }
  }, [inputValue, currentStep, completedCount, steps.length, problem]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  function handleNext() {
    setInputValue("");
    setInputError(null);
    setHintsOpen(false);
    setAnnouncement("");
    setState(createInitialState(level));
  }

  const helpfulFacts = getHelpfulFacts(problem.divisor, problem.dividend);

  // Build the quotient display string
  const quotientDigits = steps.map((s, i) =>
    i < completedCount ? String(s.quotientDigit) : "_"
  );

  return (
    <div className="w-full max-w-xl flex flex-col gap-6">
      {/* Screen reader announcements */}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>

      {/* Problem heading */}
      <div className="text-center">
        <ProblemHeading aria-label={`${problem.dividend} divided by ${problem.divisor}`}>
          {problem.dividend.toLocaleString()} ÷ {problem.divisor} = ?
        </ProblemHeading>
      </div>

      {/* Long division display */}
      <div className="flex justify-center">
      <LongDivisionDisplay
        dividend={problem.dividend}
        divisor={problem.divisor}
        steps={steps}
        completedCount={completedCount}
        quotientDigits={quotientDigits}
      />
      </div>

      {/* Step prompt */}
      {!isDone && currentStep && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-base text-slate-600 dark:text-slate-400">
            How many times does{" "}
            <span className="font-bold text-text">{problem.divisor}</span> go
            into{" "}
            <span className="font-bold tabular-nums text-text">
              {currentStep.workingNumber}
            </span>
            ?
          </p>

          <div className={`flex gap-3 justify-center ${isShaking ? "shake" : ""}`}>
            <NumberInput
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError(null);
              }}
              onKeyDown={handleKeyDown}
              aria-label={`How many times does ${problem.divisor} go into ${currentStep.workingNumber}`}
              aria-describedby={inputError ? "input-error" : undefined}
              className="w-24"
            />
            <PrimaryButton onClick={handleSubmit}>Check</PrimaryButton>
          </div>

          {inputError && <ErrorText id="input-error">{inputError}</ErrorText>}
        </div>
      )}

      {/* Done */}
      {isDone && (
        <div className="flex flex-col items-center gap-4">
          <SuccessText aria-label={`${problem.dividend} divided by ${problem.divisor} equals ${problem.quotient}, correct`}>
            <span aria-hidden="true">
              {problem.dividend.toLocaleString()} ÷ {problem.divisor} ={" "}
              {problem.quotient.toLocaleString()} ✓
            </span>
          </SuccessText>
          <PrimaryButton ref={nextButtonRef} onClick={handleNext} aria-label="Next problem" size="lg">
            <span aria-hidden="true">Next problem →</span>
          </PrimaryButton>
        </div>
      )}

      {/* Helpful facts */}
      {!isDone && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setHintsOpen((o) => !o)}
            aria-expanded={hintsOpen}
            aria-controls="hints-panel"
            className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Helpful facts for {problem.divisor}</span>
            <span className="text-xs" aria-hidden="true">
              {hintsOpen ? "▲ hide" : "▼ show"}
            </span>
          </button>
          {hintsOpen && (
            <div
              id="hints-panel"
              className="grid grid-cols-3 gap-x-2 gap-y-1 p-3 bg-slate-50 dark:bg-slate-800/50"
            >
              {helpfulFacts.map(({ multiplier, product }) => (
                <div
                  key={multiplier}
                  className="text-center text-sm tabular-nums text-slate-600 dark:text-slate-400"
                >
                  {problem.divisor} × {multiplier} = {product.toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Long division visual ─────────────────────────────────────────────────────

interface LongDivisionDisplayProps {
  dividend: number;
  divisor: number;
  steps: LongDivisionStep[];
  completedCount: number;
  quotientDigits: string[];
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
function LongDivisionDisplay({
  dividend,
  divisor,
  steps,
  completedCount,
  quotientDigits,
}: LongDivisionDisplayProps) {
  const dividendStr = String(dividend);
  const N = dividendStr.length;
  const divW = String(divisor).length;

  // 0-based index of the rightmost dividend column consumed by each step.
  const rightCols = steps.map((_, i) => alignmentForStep(steps, i) - 1);

  /**
   * Fills N digit-slots so that `value` is right-aligned to `rightCol`.
   * If the − sign fits in the grid (signCol ≥ 0), it is placed there and
   * signChar returns a space; otherwise signChar returns '−'.
   */
  function buildSlots(
    sign: "−" | " ",
    value: number,
    rightCol: number
  ): { signChar: string; slots: string[] } {
    const s = String(value);
    const len = s.length;
    const slots = Array<string>(N).fill("\u00A0");

    for (let j = 0; j < len; j++) {
      slots[rightCol - len + 1 + j] = s[j];
    }

    if (sign === "−") {
      const signCol = rightCol - len;
      if (signCol >= 0) {
        slots[signCol] = "−";
        return { signChar: "\u00A0", slots };
      }
      return { signChar: "−", slots };
    }

    return { signChar: "\u00A0", slots };
  }

  // Quotient slots: each step's digit at its rightCol position.
  const quotientSlots: { char: string; completed: boolean }[] = Array.from(
    { length: N },
    () => ({ char: "\u00A0", completed: false })
  );
  steps.forEach((s, i) => {
    quotientSlots[rightCols[i]] = {
      char: i < completedCount ? quotientDigits[i] : "_",
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

        const { signChar, slots } = buildSlots("−", step.product, rightCol);

        const isFinalDone = i === completedCount - 1 && completedCount === steps.length;

        const nextStep = i < steps.length - 1 ? steps[i + 1] : null;
        const nextRow = nextStep
          ? buildSlots(" ", nextStep.workingNumber, rightCols[i + 1])
          : null;
        const finalRow = isFinalDone ? buildSlots(" ", 0, rightCol) : null;

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
            {nextRow && (
              <div className="flex items-baseline">
                <span style={{ ...slot(divW), visibility: "hidden" }}>{divisor}</span>
                <span style={borderCompensation} />
                <span style={slot(1)} />
                {nextRow.slots.map((c, j) => (
                  <span key={j} style={slot()} className="text-text">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Final remainder (0) */}
            {finalRow && (
              <div className="flex items-baseline">
                <span style={{ ...slot(divW), visibility: "hidden" }}>{divisor}</span>
                <span style={borderCompensation} />
                <span style={slot(1)} />
                {finalRow.slots.map((c, j) => (
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
 * Returns the 1-indexed count of dividend digits consumed through step[i].
 * Subtract 1 to get the 0-based rightmost column index for that step.
 */
function alignmentForStep(steps: LongDivisionStep[], stepIndex: number): number {
  let consumed = 0;
  for (let i = 0; i <= stepIndex; i++) {
    const wLen = String(steps[i].workingNumber).length;
    const prevRem = i === 0 ? 0 : steps[i - 1].remainder;
    const prevRemLen = prevRem === 0 ? 0 : String(prevRem).length;
    consumed += wLen - prevRemLen;
  }
  return consumed;
}
