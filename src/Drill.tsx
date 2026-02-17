import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";
import QuizBoard from "./QuizBoard";

interface DrillProps {
  durationMinutes: number;
}

function Drill({ durationMinutes }: DrillProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isDrillComplete, setIsDrillComplete] = useState(false);
  const [resetKey, setResetKey] = useState(0);

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

  const handleCorrect = useCallback(() => {
    setCorrectCount((prev) => prev + 1);
  }, []);

  const handleWrong = useCallback(() => {
    setWrongCount((prev) => prev + 1);
  }, []);

  const handleRestart = useCallback(() => {
    setCorrectCount(0);
    setWrongCount(0);
    setTimeRemaining(durationMinutes * 60);
    setIsDrillComplete(false);
    setResetKey((prev) => prev + 1);
  }, [durationMinutes]);

  if (isDrillComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-background">
        <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-bold text-text">
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <NavBar />
      <QuizBoard
        key={resetKey}
        onCorrect={handleCorrect}
        onWrong={handleWrong}
      />
    </div>
  );
}

export default Drill;
