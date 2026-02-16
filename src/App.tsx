import { useState, useCallback } from "react";

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

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);

  const handleStart = useCallback(() => {
    setQuestion(generateQuestion());
    setIsPlaying(true);
  }, []);

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
        <div className="flex flex-col items-center">
          {/* Flash Card - playing card proportions (2.5 x 3.5 inches = 5:7 ratio) */}
          <div className="flex h-[350px] w-[250px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="text-center">
              <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">
                {question?.a} × {question?.b}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
