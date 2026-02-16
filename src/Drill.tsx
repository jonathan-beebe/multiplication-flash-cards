import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Card from "./Card";
import NavBar from "./NavBar";

interface Question {
  a: number;
  b: number;
}

function generateQuestion(min: number = 3, max: number = 12): Question {
  const range = max - min + 1;
  return {
    a: Math.floor(Math.random() * range) + min,
    b: Math.floor(Math.random() * range) + min,
  };
}

function generateChoices(a: number, b: number): number[] {
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

interface DrillProps {
  durationMinutes: number;
}

function Drill({ durationMinutes }: DrillProps) {
  const [question, setQuestion] = useState<Question>(generateQuestion);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<Set<number>>(new Set());
  const [showCorrect, setShowCorrect] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isDrillComplete, setIsDrillComplete] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const choices = useMemo(() => {
    return generateChoices(question.a, question.b);
  }, [question]);

  const correctAnswer = question.a * question.b;

  useEffect(() => {
    if (isDrillComplete || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsDrillComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDrillComplete, timeRemaining]);

  const handleAnswer = useCallback(
    (answer: number) => {
      if (answer === correctAnswer) {
        setCorrectCount((prev) => prev + 1);
        setShowCorrect(true);
        setTimeout(() => {
          setNextQuestion(generateQuestion());
          setIsAnimating(true);
          setShowCorrect(false);
        }, 300);
      } else {
        if (!wrongAnswers.has(answer)) {
          setWrongCount((prev) => prev + 1);
        }
        setWrongAnswers((prev) => new Set(prev).add(answer));
      }
    },
    [correctAnswer, wrongAnswers]
  );

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      setQuestion(nextQuestion!);
      setNextQuestion(null);
      setWrongAnswers(new Set());
      setIsAnimating(false);
    },
    [nextQuestion]
  );

  const handleRestart = useCallback(() => {
    setQuestion(generateQuestion());
    setNextQuestion(null);
    setWrongAnswers(new Set());
    setCorrectCount(0);
    setWrongCount(0);
    setTimeRemaining(durationMinutes * 60);
    setIsDrillComplete(false);
    setIsAnimating(false);
  }, [durationMinutes]);

  if (isDrillComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
        <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Drill Complete!
          </h1>
          <div className="flex flex-col gap-4 rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="text-2xl text-slate-700 dark:text-slate-300">
              <span className="font-bold text-green-600 dark:text-green-400">
                {correctCount}
              </span>{" "}
              correct
            </div>
            <div className="text-2xl text-slate-700 dark:text-slate-300">
              <span className="font-bold text-red-600 dark:text-red-400">
                {wrongCount}
              </span>{" "}
              wrong
            </div>
          </div>
          <div className="flex gap-4">
            <button
              className="rounded-xl bg-indigo-600 px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600"
              onClick={handleRestart}
            >
              Restart
            </button>
            <Link
              to="/"
              className="rounded-xl bg-slate-600 px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-slate-500 active:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-400 dark:active:bg-slate-600"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const backQuestion = nextQuestion ?? question;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      <NavBar />
      <div className="flex w-full flex-col items-center gap-8">
        <div className="card-stack">
          {/* Back card: next question, zooms in from 80% */}
          <Card
            a={backQuestion.a}
            b={backQuestion.b}
            className={isAnimating ? "card-zoom-in" : undefined}
            style={{ zIndex: 1, transform: isAnimating ? undefined : "scale(0.8)" }}
          />
          {/* Front card: current question, slides out right */}
          <Card
            a={question.a}
            b={question.b}
            className={isAnimating ? "card-slide-out" : undefined}
            style={{ zIndex: 2 }}
            onTransitionEnd={isAnimating ? handleTransitionEnd : undefined}
          />
        </div>
        <div className={`flex flex-wrap justify-center gap-3 transition-opacity duration-150 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
          {choices.map((choice) => {
            const isWrong = wrongAnswers.has(choice);
            const isCorrect = showCorrect && choice === correctAnswer;
            const fadeOut = (showCorrect || isAnimating) && !isCorrect;
            return (
              <button
                key={choice}
                onClick={() => handleAnswer(choice)}
                disabled={isWrong || showCorrect || isAnimating}
                className={`min-w-[72px] rounded-xl px-6 py-4 text-xl font-semibold shadow-lg transition-opacity duration-150 ${
                  fadeOut ? "opacity-0" : ""
                } ${
                  isCorrect
                    ? "bg-green-500 text-white dark:bg-green-600"
                    : isWrong
                      ? "cursor-not-allowed bg-red-500 text-white dark:bg-red-600"
                      : "bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:active:bg-slate-500"
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Drill;
