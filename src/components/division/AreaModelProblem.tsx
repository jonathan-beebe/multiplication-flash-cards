import { useState, useRef, useEffect, useCallback } from "react";
import { useGameActive } from "@/lib/useGameActive";
import {
  generateProblem,
  getHelpfulFacts,
  validatePartialQuotient,
} from "@/lib/divisionProblem";
import type { Level, Problem, Section } from "@/lib/divisionProblem";
import AreaModelRect from "@/components/division/AreaModelRect";

type Phase = "building" | "summing" | "done";

interface ProblemState {
  problem: Problem;
  sections: Section[];
  remaining: number;
  phase: Phase;
}

function createInitialState(level: Level): ProblemState {
  const problem = generateProblem(level);
  return { problem, sections: [], remaining: problem.dividend, phase: "building" };
}

interface AreaModelProblemProps {
  level: Level;
}

export default function AreaModelProblem({ level }: AreaModelProblemProps) {
  const [{ problem, sections, remaining, phase }, setProblemState] = useState<ProblemState>(
    () => createInitialState(level)
  );
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  useGameActive(phase !== "done")

  // Focus the input whenever the phase changes (building or summing),
  // or the "Next problem" button when done. The delay prevents the Enter
  // keyup from immediately activating the newly focused button.
  useEffect(() => {
    if (phase === "done") {
      const id = setTimeout(() => nextButtonRef.current?.focus(), 50);
      return () => clearTimeout(id);
    } else {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [phase]);

  function triggerShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  }

  const handleBuildingSubmit = useCallback(() => {
    const value = parseInt(inputValue, 10);

    if (isNaN(value)) {
      triggerShake();
      setInputError("Enter a whole number");
      inputRef.current?.focus();
      return;
    }

    const result = validatePartialQuotient(value, problem.divisor, remaining);
    if (!result.valid) {
      triggerShake();
      setInputError(result.error);
      inputRef.current?.focus();
      return;
    }

    const area = value * problem.divisor;
    const newRemaining = remaining - area;
    const newSections = [...sections, { partialQuotient: value, area }];

    setInputValue("");
    setInputError(null);
    inputRef.current?.focus();

    if (newRemaining === 0) {
      // Single section → skip summing, answer is the partial quotient itself.
      const nextPhase = newSections.length === 1 ? "done" : "summing";
      setProblemState((s) => ({
        ...s,
        sections: newSections,
        remaining: 0,
        phase: nextPhase,
      }));
      if (nextPhase === "summing") {
        setAnnouncement(
          `${area.toLocaleString()} placed. Rectangle complete. Now add up the partial quotients.`
        );
      } else {
        setAnnouncement(
          `Correct! ${problem.dividend.toLocaleString()} divided by ${problem.divisor} equals ${problem.quotient}.`
        );
      }
    } else {
      setProblemState((s) => ({
        ...s,
        sections: newSections,
        remaining: newRemaining,
      }));
      setAnnouncement(
        `${area.toLocaleString()} placed. ${newRemaining.toLocaleString()} remaining.`
      );
    }
  }, [inputValue, problem, remaining, sections]);

  const handleSummingSubmit = useCallback(() => {
    const value = parseInt(inputValue, 10);

    if (isNaN(value)) {
      triggerShake();
      setInputError("Enter a whole number");
      inputRef.current?.focus();
      return;
    }

    setInputValue("");
    inputRef.current?.focus();

    if (value === problem.quotient) {
      setInputError(null);
      setProblemState((s) => ({ ...s, phase: "done" }));
      setAnnouncement(
        `Correct! ${problem.dividend.toLocaleString()} divided by ${problem.divisor} equals ${problem.quotient}.`
      );
    } else {
      triggerShake();
      setInputError("Not quite — check your addition and try again");
    }
  }, [inputValue, problem]);

  function handleSubmit() {
    if (phase === "building") handleBuildingSubmit();
    else if (phase === "summing") handleSummingSubmit();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  function handleNext() {
    setInputValue("");
    setInputError(null);
    setHintsOpen(false);
    setAnnouncement("");
    setProblemState(createInitialState(level));
  }

  const helpfulFacts = getHelpfulFacts(problem.divisor, problem.dividend);

  const sumEquation = sections.map((s) => s.partialQuotient.toLocaleString()).join(" + ");

  return (
    <div className="w-full max-w-xl flex flex-col gap-6">
      {/* Screen reader announcements */}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>

      {/* Problem heading */}
      <div className="text-center">
        <p className="text-4xl font-bold tabular-nums text-text" aria-label={`${problem.dividend} divided by ${problem.divisor}`}>
          {problem.dividend.toLocaleString()} ÷ {problem.divisor} = ?
        </p>
      </div>

      {/* Area model rectangle */}
      <AreaModelRect
        divisor={problem.divisor}
        dividend={problem.dividend}
        sections={sections}
        remaining={remaining}
      />

      {/* Building phase */}
      {phase === "building" && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-base text-slate-600 dark:text-slate-400">
            {problem.divisor} ×{" "}
            <span className="font-bold text-text">?</span> ={" "}
            how much of{" "}
            <span className="font-bold tabular-nums text-text">
              {remaining.toLocaleString()}
            </span>{" "}
            can you fill?
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
              aria-label="Enter a partial quotient"
              aria-describedby={inputError ? "input-error" : undefined}
              className="w-32 text-center text-2xl font-bold rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-text px-3 py-2 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 tabular-nums"
            />
            <button
              onClick={handleSubmit}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold px-5 py-2 shadow-md transition-all"
            >
              Place
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

      {/* Summing phase */}
      {phase === "summing" && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-lg font-semibold text-text" aria-label={`Add the partial quotients: ${sumEquation} equals what?`}>
            {sumEquation} = ?
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
              aria-label="Enter the sum of partial quotients"
              aria-describedby={inputError ? "input-error" : undefined}
              className="w-32 text-center text-2xl font-bold rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-text px-3 py-2 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 tabular-nums"
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

      {/* Done phase */}
      {phase === "done" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
            {problem.dividend.toLocaleString()} ÷ {problem.divisor} ={" "}
            {problem.quotient.toLocaleString()} ✓
          </p>
          <button
            ref={nextButtonRef}
            onClick={handleNext}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold px-8 py-3 text-lg shadow-md transition-all"
          >
            Next problem →
          </button>
        </div>
      )}

      {/* Helpful facts panel */}
      {phase !== "done" && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setHintsOpen((o) => !o)}
            aria-expanded={hintsOpen}
            className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Helpful facts for {problem.divisor}</span>
            <span className="text-xs" aria-hidden="true">
              {hintsOpen ? "▲ hide" : "▼ show"}
            </span>
          </button>

          {hintsOpen && (
            <div className="grid grid-cols-3 gap-x-2 gap-y-1 p-3 bg-slate-50 dark:bg-slate-800/50">
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
