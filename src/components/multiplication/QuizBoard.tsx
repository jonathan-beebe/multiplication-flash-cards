import { useState, useCallback, useMemo, useRef } from "react";
import QuizButton from "@/components/multiplication/QuizButton";
import type { QuestionGenerator } from "@/lib/engine/gameEngine";

export interface CardAnimationProps {
  className?: string;
  style?: React.CSSProperties;
  onTransitionEnd?: React.TransitionEventHandler<HTMLDivElement>;
  'aria-hidden'?: boolean | "true" | "false";
}

interface QuizBoardProps<Q> {
  generator: QuestionGenerator<Q>;
  getNextQuestion: () => Q;
  renderQuestion: (question: Q, animProps: CardAnimationProps) => React.ReactNode;
  onCorrect?: () => void;
  onWrong?: () => void;
  onAnswer?: (question: Q, correct: boolean, durationMs: number) => void;
  now?: () => number;
}

export default function QuizBoard<Q>({ generator, getNextQuestion, renderQuestion, onCorrect, onWrong, onAnswer, now = Date.now }: QuizBoardProps<Q>) {
  const [question, setQuestion] = useState<Q>(() => getNextQuestion());
  const [nextQuestion, setNextQuestion] = useState<Q | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<Set<number>>(new Set());
  const [showCorrect, setShowCorrect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideRotation, setSlideRotation] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choicesRef = useRef<HTMLDivElement>(null);
  const questionStartRef = useRef<number>(now());

  const announce = useCallback((text: string) => {
    setAnnouncement("");
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => setAnnouncement(text), 50);
  }, []);

  const choices = useMemo(() => {
    return generator.generateChoices(question);
  }, [question, generator]);

  const handleAnswer = useCallback(
    (answer: number) => {
      if (generator.evaluate(question, answer)) {
        const durationMs = now() - questionStartRef.current;
        onAnswer?.(question, wrongAnswers.size === 0, durationMs);
        onCorrect?.();
        setShowCorrect(true);
        setTimeout(() => {
          setNextQuestion(getNextQuestion());
          setSlideRotation(Math.random() * 70 - 35);
          setIsAnimating(true);
          setShowCorrect(false);
        }, 300);
      } else {
        if (!wrongAnswers.has(answer)) {
          onWrong?.();
          announce(`${answer} is incorrect. Try again.`);
        }
        setWrongAnswers((prev) => new Set(prev).add(answer));
      }
    },
    [generator, question, wrongAnswers, onCorrect, onWrong, onAnswer, getNextQuestion, announce, now]
  );

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      const next = nextQuestion!;
      setQuestion(next);
      setNextQuestion(null);
      setWrongAnswers(new Set());
      setIsAnimating(false);
      questionStartRef.current = now();
      announce(`Correct! Next question: ${generator.displayText(next)}`);
      setTimeout(() => {
        choicesRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
      }, 0);
    },
    [nextQuestion, announce, generator, now]
  );

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
        {renderQuestion(backQuestion, {
          'aria-hidden': true,
          className: isAnimating ? "card-zoom-in" : undefined,
          style: { zIndex: 1, transform: isAnimating ? undefined : "scale(0.8)" },
        })}
        {renderQuestion(question, {
          className: isAnimating ? "card-slide-out" : undefined,
          style: {
            zIndex: 2,
            ...(isAnimating && {
              transform: `translateX(calc(50vw + 100%)) rotate(${slideRotation}deg)`,
            }),
          },
          onTransitionEnd: isAnimating ? handleTransitionEnd : undefined,
        })}
      </div>
      <div
        ref={choicesRef}
        className={`flex flex-wrap justify-center gap-3 transition-opacity duration-150 ${isAnimating ? "opacity-0" : "opacity-100"}`}
      >
        {choices.map((choice) => {
          const isWrong = wrongAnswers.has(choice);
          const isCorrectChoice = showCorrect && generator.evaluate(question, choice);
          const fadeOut = (showCorrect || isAnimating) && !isCorrectChoice;
          return (
            <QuizButton
              key={choice}
              value={choice}
              onClick={() => handleAnswer(choice)}
              disabled={isWrong || showCorrect || isAnimating}
              state={isCorrectChoice ? "correct" : isWrong ? "wrong" : fadeOut ? "fade-out" : "default"}
            />
          );
        })}
      </div>
    </div>
  );
}
