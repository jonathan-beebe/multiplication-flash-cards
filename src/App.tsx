import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

interface Question {
  a: number;
  b: number;
}

function generateQuestion(): Question {
  return {
    a: Math.floor(Math.random() * 13),
    b: Math.floor(Math.random() * 13),
  };
}

function generateChoices(a: number, b: number): number[] {
  // Generate 3 choices from a×(b-1), a×b, a×(b+1)
  // Handle edge cases at boundaries (0 and 12)
  let offsets: number[];
  if (b === 0) {
    offsets = [0, 1, 2];
  } else if (b === 12) {
    offsets = [-2, -1, 0];
  } else {
    offsets = [-1, 0, 1];
  }

  const choices = offsets.map((offset) => a * (b + offset));

  // Shuffle the array (Fisher-Yates)
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<Set<number>>(new Set());
  const [showCorrect, setShowCorrect] = useState(false);
  const [drillDuration, setDrillDuration] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isDrillComplete, setIsDrillComplete] = useState(false);

  const choices = useMemo(() => {
    if (!question) return [];
    return generateChoices(question.a, question.b);
  }, [question]);

  const correctAnswer = question ? question.a * question.b : 0;

  // Timer countdown effect
  useEffect(() => {
    if (!isPlaying || drillDuration === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsDrillComplete(true);
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, drillDuration, timeRemaining]);

  const handleStart = useCallback(() => {
    setQuestion(generateQuestion());
    setWrongAnswers(new Set());
    setCorrectCount(0);
    setWrongCount(0);
    setDrillDuration(null);
    setIsPlaying(true);
  }, []);

  const handleStartDrill = useCallback((durationMinutes: number) => {
    setQuestion(generateQuestion());
    setWrongAnswers(new Set());
    setCorrectCount(0);
    setWrongCount(0);
    setDrillDuration(durationMinutes);
    setTimeRemaining(durationMinutes * 60);
    setIsDrillComplete(false);
    setIsPlaying(true);
  }, []);

  const handleRestartDrill = useCallback(() => {
    if (drillDuration !== null) {
      handleStartDrill(drillDuration);
    }
  }, [drillDuration, handleStartDrill]);

  const handleGoHome = useCallback(() => {
    setIsPlaying(false);
    setIsDrillComplete(false);
    setDrillDuration(null);
    setQuestion(null);
  }, []);

  const handleAnswer = useCallback(
    (answer: number) => {
      if (answer === correctAnswer) {
        setCorrectCount((prev) => prev + 1);
        setShowCorrect(true);
        setTimeout(() => {
          setQuestion(generateQuestion());
          setWrongAnswers(new Set());
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

  // Completion screen
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
              onClick={handleRestartDrill}
            >
              Restart
            </button>
            <button
              className="rounded-xl bg-slate-600 px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-slate-500 active:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-400 dark:active:bg-slate-600"
              onClick={handleGoHome}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      {!isPlaying ? (
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <h1 className="mb-8 text-4xl font-bold text-slate-900 dark:text-slate-100">
            Multiplication Flash{'\u00A0'}Cards
          </h1>
          <div className="flex w-full max-w-xs flex-col items-center gap-6">
            <button
              className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600"
              onClick={handleStart}
            >
              Start Learning
            </button>
            <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
              Drills
            </h2>
            <div className="flex w-full flex-col gap-4">
              <button
                className="w-full rounded-xl bg-amber-600 px-6 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-amber-500 active:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:active:bg-amber-600"
                onClick={() => handleStartDrill(1)}
              >
                1 min
              </button>
              <button
                className="w-full rounded-xl bg-amber-600 px-6 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-amber-500 active:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:active:bg-amber-600"
                onClick={() => handleStartDrill(3)}
              >
                3 min
              </button>
              <button
                className="w-full rounded-xl bg-amber-600 px-6 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-amber-500 active:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:active:bg-amber-600"
                onClick={() => handleStartDrill(5)}
              >
                5 min
              </button>
            </div>
            <Link
              to="/about"
              className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              About
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-8">
          <button
            onClick={handleGoHome}
            className="fixed left-4 top-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Home
          </button>
          {/* Flash Card */}
          <div className="flex h-[350px] w-[250px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="text-center">
              <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">
                {question?.a} × {question?.b}
              </span>
            </div>
          </div>

          {/* Multiple Choice Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {choices.map((choice) => {
              const isWrong = wrongAnswers.has(choice);
              const isCorrect = showCorrect && choice === correctAnswer;
              return (
                <button
                  key={choice}
                  onClick={() => handleAnswer(choice)}
                  disabled={isWrong || showCorrect}
                  className={`min-w-[72px] rounded-xl px-6 py-4 text-xl font-semibold shadow-lg transition-colors ${
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
      )}
    </div>
  );
}

export default App;
