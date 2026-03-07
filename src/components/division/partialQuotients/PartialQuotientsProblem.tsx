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

interface Props {
  level: Level;
}

export default function PartialQuotientsProblem({ level }: Props) {
  const [{ problem, sections, remaining, phase }, setProblemState] =
    useState<ProblemState>(() => createInitialState(level));
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

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
      const nextPhase = newSections.length === 1 ? "done" : "summing";
      setProblemState((s) => ({
        ...s,
        sections: newSections,
        remaining: 0,
        phase: nextPhase,
      }));
      if (nextPhase === "summing") {
        setAnnouncement(
          `${area.toLocaleString()} subtracted. Remainder is 0. Now add the partial quotients.`
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
        `${area.toLocaleString()} subtracted. ${newRemaining.toLocaleString()} remaining.`
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
        <ProblemHeading
          aria-label={`${problem.dividend} divided by ${problem.divisor} equals ${phase === "done" ? problem.quotient : "unknown"}`}
        >
          {problem.dividend.toLocaleString()} ÷ {problem.divisor} ={" "}
          {phase === "done" ? (
            <span className="text-teal-600 dark:text-teal-400">
              {problem.quotient.toLocaleString()}
            </span>
          ) : (
            "?"
          )}
        </ProblemHeading>
      </div>

      {/* Stacked partial quotients display */}
      <PartialQuotientsDisplay
        dividend={problem.dividend}
        divisor={problem.divisor}
        sections={sections}
        remaining={remaining}
        phase={phase}
      />

      {/* Building phase */}
      {phase === "building" && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-base text-slate-600 dark:text-slate-400">
            Choose a multiple of{" "}
            <span className="font-bold text-text">{problem.divisor}</span> to
            subtract from{" "}
            <span className="font-bold tabular-nums text-text">
              {remaining.toLocaleString()}
            </span>
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
            <PrimaryButton onClick={handleSubmit}>Subtract</PrimaryButton>
          </div>

          {inputError && <ErrorText id="input-error">{inputError}</ErrorText>}
        </div>
      )}

      {/* Summing phase */}
      {phase === "summing" && (
        <div className="flex flex-col gap-3">
          <Subheading
            className="text-center"
            aria-label={`Add the partial quotients: ${sumEquation} equals what?`}
          >
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

      {/* Done */}
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

      {/* Helpful facts */}
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

// ─── Visual display ───────────────────────────────────────────────────────────

interface DisplayProps {
  dividend: number;
  divisor: number;
  sections: Section[];
  remaining: number;
  phase: Phase;
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
function PartialQuotientsDisplay({
  dividend,
  divisor,
  sections,
  remaining,
  phase,
}: DisplayProps) {
  const showTotal = phase === "done" && sections.length > 1;

  // Column widths in ch units — use raw digit count, not toLocaleString,
  // so widths stay accurate in the monospace grid.
  const numW = String(dividend).length;
  const quotient = Math.round(dividend / divisor);
  const pqW = Math.max(String(quotient).length, 2);

  // Pre-compute running remainders after each section.
  const remainders: number[] = [];
  let running = dividend;
  for (const s of sections) {
    running -= s.area;
    remainders.push(running);
  }

  const total = sections.reduce((acc, s) => acc + s.partialQuotient, 0);

  // Shared slot styles
  const signSlot: React.CSSProperties = {
    display: "inline-block",
    width: "1ch",
    flexShrink: 0,
    textAlign: "center",
  };
  const numSlot: React.CSSProperties = {
    display: "inline-block",
    width: `${numW}ch`,
    textAlign: "right",
    flexShrink: 0,
  };
  const pqSlot: React.CSSProperties = {
    display: "inline-block",
    width: `${pqW}ch`,
    textAlign: "right",
    flexShrink: 0,
    paddingLeft: "1.5ch",
  };

  return (
    <div
      className="font-mono tabular-nums select-none text-lg leading-snug mx-auto"
      style={{ width: "fit-content" }}
      aria-hidden="true"
    >
      {/* Outer row: divisor label + bracketed content area */}
      <div className="flex items-stretch">
        {/* Divisor label — sits outside the bracket */}
        <span
          className="font-bold text-text self-end pb-0.5 pr-0.5"
          style={{ flexShrink: 0 }}
        >
          {divisor}
        </span>

        {/* Content area: continuous border-l-2; header row gets border-t-2 too */}
        <div className="border-l-2 border-slate-500 dark:border-slate-400 flex flex-col">
          {/* ── Header row: dividend ─────────────────────────────── */}
          <div
            className="flex items-center border-t-2 border-slate-500 dark:border-slate-400"
            style={{ paddingLeft: "0.25rem" }}
          >
            <span style={signSlot} />
            <span className="font-bold text-text" style={numSlot}>
              {dividend}
            </span>
          </div>

          {/* ── Subtraction steps ─────────────────────────────────── */}
          {sections.map((section, i) => {
            const rem = remainders[i];
            return (
              <div
                key={i}
                className="flex flex-col"
                style={{ paddingLeft: "0.25rem" }}
              >
                {/* Subtract row */}
                <div className="flex items-center text-slate-600 dark:text-slate-400 font-semibold">
                  <span style={signSlot}>−</span>
                  <span style={numSlot}>{section.area}</span>
                  <span
                    className="font-bold text-teal-600 dark:text-teal-400"
                    style={pqSlot}
                  >
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
                    rem === 0
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-text"
                  }`}
                >
                  <span style={signSlot} />
                  <span style={numSlot}>{rem}</span>
                </div>
              </div>
            );
          })}

          {/* ── Total row (when done, multiple sections) ──────────── */}
          {showTotal && (
            <div style={{ paddingLeft: "0.25rem" }}>
              {/* Double rule across sign + number + pq */}
              <div
                className="border-t-2 border-slate-500 dark:border-slate-400"
                style={{ width: `calc(1ch + ${numW}ch + 1.5ch + ${pqW}ch)` }}
              />
              <div className="flex items-center">
                <span style={signSlot} />
                <span
                  className="text-sm text-slate-500 dark:text-slate-400"
                  style={{ ...numSlot, fontSize: "0.75em" }}
                >
                  total
                </span>
                <span
                  className="font-bold text-teal-600 dark:text-teal-400 text-xl"
                  style={pqSlot}
                >
                  {total}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
