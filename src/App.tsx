import { useState, useCallback, useMemo } from "react";

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
  // Generate choices from a×(b-1), a×b, a×(b+1)
  // Handle edge cases at boundaries (0 and 12)
  let offsets: number[];
  if (b === 0) {
    offsets = [0, 1, 2];
  } else if (b === 12) {
    offsets = [-2, -1, 0];
  } else {
    offsets = [-1, 0, 1];
  }

  return offsets.map((offset) => a * (b + offset)).sort((x, y) => x - y);
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<Set<number>>(new Set());

  const choices = useMemo(() => {
    if (!question) return [];
    return generateChoices(question.a, question.b);
  }, [question]);

  const correctAnswer = question ? question.a * question.b : 0;

  const handleStart = useCallback(() => {
    setQuestion(generateQuestion());
    setWrongAnswers(new Set());
    setIsPlaying(true);
  }, []);

  const handleAnswer = useCallback(
    (answer: number) => {
      if (answer === correctAnswer) {
        setQuestion(generateQuestion());
        setWrongAnswers(new Set());
      } else {
        setWrongAnswers((prev) => new Set(prev).add(answer));
      }
    },
    [correctAnswer]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      {!isPlaying ? (
        <div className="text-center">
          <h1 className="mb-8 text-4xl font-bold text-slate-900 dark:text-slate-100">
            Multiplication Flash Cards
          </h1>
          <button
            className="rounded-xl bg-indigo-600 px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600"
            onClick={handleStart}
          >
            Start
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8">
          {/* Flash Card */}
          <div className="flex h-[350px] w-[250px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="text-center">
              <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">
                {question?.a} × {question?.b}
              </span>
            </div>
          </div>

          {/* Multiple Choice Buttons */}
          <div className="flex gap-4">
            {choices.map((choice) => {
              const isWrong = wrongAnswers.has(choice);
              return (
                <button
                  key={choice}
                  onClick={() => handleAnswer(choice)}
                  disabled={isWrong}
                  className={`min-w-[72px] rounded-xl px-6 py-4 text-xl font-semibold shadow-lg transition-colors ${
                    isWrong
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
