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
import LongDivisionDisplay from "@/components/division/LongDivisionDisplay";

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
              error={!!inputError}
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
