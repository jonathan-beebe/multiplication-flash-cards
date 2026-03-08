import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface DrillCompleteProps {
  correctCount?: number;
  wrongCount?: number;
}

export function DrillCompleteContent({ correctCount = 0, wrongCount = 0, onRestart }: {
  correctCount?: number;
  wrongCount?: number;
  onRestart?: () => void;
}) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
      <h1 className="text-4xl font-bold text-text">
        Drill Complete!
      </h1>
      <div className="flex flex-col gap-4 rounded-2xl border-2 border-slate-200 bg-white p-8 text-left shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <div className="text-2xl text-slate-700 dark:text-slate-300">
          <span className="font-bold text-text">
            {correctCount + wrongCount}
          </span>{" "}
          attempted
        </div>
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
        {onRestart && (
          <button
            className="rounded-xl bg-indigo-600 px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-500 dark:active:bg-indigo-600"
            onClick={onRestart}
          >
            Restart
          </button>
        )}
        <Link
          to="/"
          className="rounded-xl bg-slate-600 px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-slate-500 active:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-500 dark:active:bg-slate-600"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

function DrillComplete({ correctCount: propCorrect, wrongCount: propWrong }: DrillCompleteProps) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Drill Complete — Math Flash Cards";
  }, []);

  const correctCount = propCorrect ?? location.state?.correctCount ?? 0;
  const wrongCount = propWrong ?? location.state?.wrongCount ?? 0;
  const onRestart = location.state
    ? () => navigate("..", { relative: "path", replace: true })
    : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-background">
      <DrillCompleteContent
        correctCount={correctCount}
        wrongCount={wrongCount}
        onRestart={onRestart}
      />
    </main>
  );
}

export default DrillComplete;
