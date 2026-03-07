import { useState, useRef, useEffect, useCallback } from "react";
import {
  generateProblem,
  getHelpfulFacts,
  validatePartialQuotient,
} from "@/lib/division/areaMode/divisionProblem";
import ErrorText from "@/components/atoms/ErrorText";
import PrimaryButton from "@/components/atoms/PrimaryButton";
import NumberInput from "@/components/atoms/NumberInput";
import SuccessText from "@/components/atoms/SuccessText";
import ProblemHeading from "@/components/atoms/ProblemHeading";
import Subheading from "@/components/atoms/Subheading";
import type { Level, Problem, Section } from "@/lib/division/areaMode/divisionProblem";
import AreaModelRect from "@/components/division/areaMode/AreaModelRect";

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
        <ProblemHeading aria-label={`${problem.dividend} divided by ${problem.divisor}`}>
          {problem.dividend.toLocaleString()} ÷ {problem.divisor} = ?
        </ProblemHeading>
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
            <NumberInput
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError(null);
              }}
              onKeyDown={handleKeyDown}
              aria-label="Enter a partial quotient"
              aria-describedby={inputError ? "input-error" : undefined}
              error={!!inputError}
            />
            <PrimaryButton onClick={handleSubmit}>Place</PrimaryButton>
          </div>

          {inputError && <ErrorText id="input-error">{inputError}</ErrorText>}
        </div>
      )}

      {/* Summing phase */}
      {phase === "summing" && (
        <div className="flex flex-col gap-3">
          <Subheading className="text-center" aria-label={`Add the partial quotients: ${sumEquation} equals what?`}>
            {sumEquation} = ?
          </Subheading>

          <div className={`flex gap-3 justify-center ${isShaking ? "shake" : ""}`}>
            <NumberInput
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError(null);
              }}
              onKeyDown={handleKeyDown}
              aria-label="Enter the sum of partial quotients"
              aria-describedby={inputError ? "input-error" : undefined}
              error={!!inputError}
            />
            <PrimaryButton onClick={handleSubmit}>Check</PrimaryButton>
          </div>

          {inputError && <ErrorText id="input-error">{inputError}</ErrorText>}
        </div>
      )}

      {/* Done phase */}
      {phase === "done" && (
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

      {/* Helpful facts panel */}
      {phase !== "done" && (
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
            <div id="hints-panel" className="grid grid-cols-3 gap-x-2 gap-y-1 p-3 bg-slate-50 dark:bg-slate-800/50">
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
