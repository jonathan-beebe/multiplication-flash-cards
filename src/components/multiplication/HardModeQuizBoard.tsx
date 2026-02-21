import { useState, useCallback, useRef, useEffect } from "react";
import Card from "@/components/Card";
import { generateQuestion } from "@/components/multiplication/QuizBoard";
import type { Question } from "@/components/multiplication/QuizBoard";

export default function HardModeQuizBoard() {
  const [question, setQuestion] = useState<Question>(generateQuestion);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideRotation, setSlideRotation] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, []);

  const announce = useCallback((text: string) => {
    setAnnouncement("");
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => setAnnouncement(text), 50);
  }, []);

  function triggerShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  }

  const correctAnswer = question.a * question.b;

  const handleSubmit = useCallback(() => {
    if (isAnimating || showCorrect) return;

    const value = parseInt(inputValue, 10);

    if (isNaN(value)) {
      triggerShake();
      setInputError("Enter a number");
      inputRef.current?.focus();
      return;
    }

    if (value === correctAnswer) {
      setInputError(null);
      setShowCorrect(true);
      announce(`Correct! ${question.a} times ${question.b} equals ${correctAnswer}.`);
      setTimeout(() => {
        const next = generateQuestion();
        setNextQuestion(next);
        setSlideRotation(Math.random() * 70 - 35);
        setIsAnimating(true);
        setShowCorrect(false);
      }, 300);
    } else {
      triggerShake();
      setInputError("Try again");
      announce(`${value} is incorrect. Try again.`);
      inputRef.current?.focus();
    }
  }, [inputValue, correctAnswer, isAnimating, showCorrect, question, announce]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      const next = nextQuestion!;
      setQuestion(next);
      setNextQuestion(null);
      setInputValue("");
      setInputError(null);
      setIsAnimating(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [nextQuestion]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  const backQuestion = nextQuestion ?? question;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </span>
      <div className="card-stack">
        <Card
          a={backQuestion.a}
          b={backQuestion.b}
          aria-hidden={true}
          className={isAnimating ? "card-zoom-in" : undefined}
          style={{ zIndex: 1, transform: isAnimating ? undefined : "scale(0.8)" }}
        />
        <Card
          a={question.a}
          b={question.b}
          className={isAnimating ? "card-slide-out" : undefined}
          style={{
            zIndex: 2,
            ...(isAnimating && {
              transform: `translateX(calc(50vw + 100%)) rotate(${slideRotation}deg)`,
            }),
          }}
          onTransitionEnd={isAnimating ? handleTransitionEnd : undefined}
        />
      </div>

      <div className={`flex flex-col items-center gap-3 transition-opacity duration-150 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
        {showCorrect && (
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 py-2 border-2 border-transparent">
            Correct!
          </p>
        )}

        {!showCorrect && (
          <>
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
                aria-label="Enter your answer"
                aria-describedby={inputError ? "input-error" : undefined}
                className="w-32 text-center text-2xl font-bold rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-text px-3 py-2 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 tabular-nums"
              />
              <button
                onClick={handleSubmit}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-5 py-2 shadow-md transition-all"
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
          </>
        )}
      </div>
    </div>
  );
}
