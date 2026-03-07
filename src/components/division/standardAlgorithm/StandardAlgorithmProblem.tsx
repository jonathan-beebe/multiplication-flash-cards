import { useState, useRef, useEffect, useCallback } from "react";
import { generateProblem, getHelpfulFacts } from "@/lib/division/areaMode/divisionProblem";
import type { Level, Problem } from "@/lib/division/areaMode/divisionProblem";
import {
  computeLongDivisionSteps,
  validateQuotientDigit,
} from "@/lib/division/standardAlgorithm/longDivision";
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
        <p
          className="text-4xl font-bold tabular-nums text-text"
          aria-label={`${problem.dividend} divided by ${problem.divisor}`}
        >
          {problem.dividend.toLocaleString()} ÷ {problem.divisor} = ?
        </p>
      </div>

      {/* Long division display */}
      <LongDivisionDisplay
        dividend={problem.dividend}
        divisor={problem.divisor}
        steps={steps}
        completedCount={completedCount}
        quotientDigits={quotientDigits}
      />

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
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError(null);
              }}
              onKeyDown={handleKeyDown}
              aria-label={`How many times does ${problem.divisor} go into ${currentStep.workingNumber}`}
              aria-describedby={inputError ? "input-error" : undefined}
              className="w-24 text-center text-2xl font-bold rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-text px-3 py-2 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 tabular-nums"
            />
            <button
              onClick={handleSubmit}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold px-5 py-2 shadow-md transition-all"
            >
              Check
            </button>
          </div>

          {inputError && (
            <p
              id="input-error"
              className="text-center text-sm font-medium text-red-600 dark:text-red-400"
              role="alert"
            >
              {inputError}
            </p>
          )}
        </div>
      )}

      {/* Done */}
      {isDone && (
        <div className="flex flex-col items-center gap-4">
          <p
            className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400"
            aria-label={`${problem.dividend} divided by ${problem.divisor} equals ${problem.quotient}, correct`}
          >
            <span aria-hidden="true">
              {problem.dividend.toLocaleString()} ÷ {problem.divisor} ={" "}
              {problem.quotient.toLocaleString()} ✓
            </span>
          </p>
          <button
            ref={nextButtonRef}
            onClick={handleNext}
            aria-label="Next problem"
            className="rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold px-8 py-3 text-lg shadow-md transition-all"
          >
            <span aria-hidden="true">Next problem →</span>
          </button>
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

function LongDivisionDisplay({
  dividend,
  divisor,
  steps,
  completedCount,
  quotientDigits,
}: LongDivisionDisplayProps) {
  const dividendStr = String(dividend);

  return (
    <div
      className="font-mono tabular-nums select-none mx-auto"
      aria-hidden="true"
    >
      {/* Quotient row */}
      <div className="flex items-end">
        {/* Spacer for divisor column */}
        <div className="pr-1 invisible" aria-hidden="true">
          {divisor}
        </div>
        {/* The ⟌ bracket top bar spans the dividend */}
        <div className="border-t-2 border-l-2 border-slate-500 dark:border-slate-400 pl-2 flex">
          {quotientDigits.map((d, i) => (
            <span
              key={i}
              className={`w-8 text-center text-xl font-bold ${
                i < completedCount
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Divisor + dividend row */}
      <div className="flex items-center">
        <div className="pr-1 text-xl font-bold text-text">{divisor}</div>
        <div className="border-l-2 border-slate-500 dark:border-slate-400 pl-2 flex">
          {dividendStr.split("").map((d, i) => (
            <span key={i} className="w-8 text-center text-xl font-bold text-text">
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Completed steps */}
      <div className="pl-[calc(1ch+0.25rem+2px)]">
        {steps.slice(0, completedCount).map((step, i) => {
          // Figure out alignment: the working number's rightmost digit aligns
          // with dividend digit at position (i + offset).
          // We compute the indent = number of digits to the left of this step's
          // last digit in the dividend display.
          const rightEdge = alignmentForStep(steps, i);
          const indentChars = rightEdge - String(step.workingNumber).length;

          return (
            <div key={i} className="flex flex-col">
              {/* Subtract line */}
              <div
                className="flex items-center text-slate-600 dark:text-slate-400"
                style={{ paddingLeft: `${indentChars * 2}rem` }}
              >
                <span className="w-4 text-sm">−</span>
                {String(step.product)
                  .padStart(String(step.workingNumber).length, "\u00A0")
                  .split("")
                  .map((d, j) => (
                    <span key={j} className="w-8 text-center text-lg font-semibold">
                      {d}
                    </span>
                  ))}
              </div>
              {/* Rule */}
              <div
                className="border-t border-slate-400 dark:border-slate-500"
                style={{
                  marginLeft: `${indentChars * 2 + 1}rem`,
                  width: `${String(step.workingNumber).length * 2}rem`,
                }}
              />
              {/* Remainder (with next digit brought down) */}
              {i < completedCount - 1 && (
                <div
                  className="flex text-slate-600 dark:text-slate-400"
                  style={{ paddingLeft: `${indentChars * 2}rem` }}
                >
                  <span className="w-4" />
                  {String(steps[i + 1].workingNumber)
                    .padStart(String(step.workingNumber).length + 1, "\u00A0")
                    .split("")
                    .map((d, j) => (
                      <span key={j} className="w-8 text-center text-lg">
                        {d}
                      </span>
                    ))}
                </div>
              )}
              {/* Final remainder = 0 */}
              {i === completedCount - 1 && completedCount === steps.length && (
                <div
                  className="flex text-teal-600 dark:text-teal-400 font-bold"
                  style={{ paddingLeft: `${indentChars * 2}rem` }}
                >
                  <span className="w-4" />
                  <span className="w-8 text-center text-lg">0</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Computes the 0-based index of the rightmost dividend digit consumed by
 * step[i], used to calculate horizontal alignment.
 */
function alignmentForStep(steps: LongDivisionStep[], stepIndex: number): number {
  // Each step consumes exactly the digits needed to form its workingNumber.
  // We track cumulative digits consumed.
  let consumed = 0;
  for (let i = 0; i <= stepIndex; i++) {
    const wLen = String(steps[i].workingNumber).length;
    const prevRem = i === 0 ? 0 : steps[i - 1].remainder;
    const prevRemLen = prevRem === 0 ? 0 : String(prevRem).length;
    // Digits brought down = working digits - remainder digits from previous step
    const broughtDown = wLen - prevRemLen;
    consumed += broughtDown;
  }
  return consumed;
}
