import { useState, useCallback, useMemo, useRef } from "react";
import Card from "@/components/Card";
import QuizButton from "@/components/multiplication/QuizButton";

export interface Question {
  a: number;
  b: number;
}

export function generateQuestion(min: number = 3, max: number = 12): Question {
  const range = max - min + 1;
  return {
    a: Math.floor(Math.random() * range) + min,
    b: Math.floor(Math.random() * range) + min,
  };
}

export function generateChoices(a: number, b: number): number[] {
  const correct = a * b;
  const choices = new Set<number>([correct]);

  // Try to add adjacent answers (a × (b±1))
  const adjacentOptions = [];
  if (b > 3) adjacentOptions.push(a * (b - 1));
  if (b < 12) adjacentOptions.push(a * (b + 1));

  for (const adj of adjacentOptions) {
    if (choices.size < 3 && !choices.has(adj)) {
      choices.add(adj);
    }
  }

  // Fill remaining slots with random numbers 9-144
  while (choices.size < 3) {
    const random = Math.floor(Math.random() * 136) + 9;
    if (!choices.has(random)) {
      choices.add(random);
    }
  }

  // Shuffle the array (Fisher-Yates)
  const result = Array.from(choices);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface QuizBoardProps {
  onCorrect?: () => void;
  onWrong?: () => void;
  getNextQuestion?: () => Question;
  onAnswer?: (question: Question, wrongAnswers: number[]) => void;
}

export default function QuizBoard({ onCorrect, onWrong, getNextQuestion, onAnswer }: QuizBoardProps) {
  const nextQ = getNextQuestion ?? generateQuestion;
  const [question, setQuestion] = useState<Question>(() => nextQ());
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<Set<number>>(new Set());
  const [showCorrect, setShowCorrect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideRotation, setSlideRotation] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choicesRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((text: string) => {
    setAnnouncement("");
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => setAnnouncement(text), 50);
  }, []);

  const choices = useMemo(() => {
    return generateChoices(question.a, question.b);
  }, [question]);

  const correctAnswer = question.a * question.b;

  const handleAnswer = useCallback(
    (answer: number) => {
      if (answer === correctAnswer) {
        onAnswer?.(question, [...wrongAnswers]);
        onCorrect?.();
        setShowCorrect(true);
        setTimeout(() => {
          setNextQuestion(nextQ());
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
    [correctAnswer, wrongAnswers, onCorrect, onWrong, onAnswer, question, nextQ, announce]
  );

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      const next = nextQuestion!;
      setQuestion(next);
      setNextQuestion(null);
      setWrongAnswers(new Set());
      setIsAnimating(false);
      announce(`Correct! Next question: ${next.a} times ${next.b}`);
      setTimeout(() => {
        choicesRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
      }, 0);
    },
    [nextQuestion, announce]
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
        {/* Back card: next question, zooms in from 80% — hidden from screen readers;
            the aria-live region announces the new question when transition completes */}
        <Card
          a={backQuestion.a}
          b={backQuestion.b}
          aria-hidden={true}
          className={isAnimating ? "card-zoom-in" : undefined}
          style={{ zIndex: 1, transform: isAnimating ? undefined : "scale(0.8)" }}
        />
        {/* Front card: current question, slides out right */}
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
      <div
        ref={choicesRef}
        className={`flex flex-wrap justify-center gap-3 transition-opacity duration-150 ${isAnimating ? "opacity-0" : "opacity-100"}`}
      >
        {choices.map((choice) => {
          const isWrong = wrongAnswers.has(choice);
          const isCorrect = showCorrect && choice === correctAnswer;
          const fadeOut = (showCorrect || isAnimating) && !isCorrect;
          return (
            <QuizButton
              key={choice}
              value={choice}
              onClick={() => handleAnswer(choice)}
              disabled={isWrong || showCorrect || isAnimating}
              state={isCorrect ? "correct" : isWrong ? "wrong" : fadeOut ? "fade-out" : "default"}
            />
          );
        })}
      </div>
    </div>
  );
}
