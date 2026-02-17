import { useState, useCallback, useEffect } from "react";
import NavBar from "./NavBar";
import QuizBoard from "./QuizBoard";
import DrillTimerBar from "./DrillTimerBar";
import DrillComplete from "./DrillComplete";

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
      <DrillComplete
        correctCount={correctCount}
        wrongCount={wrongCount}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <DrillTimerBar key={resetKey} durationSeconds={durationMinutes * 60} />
      <div className="fixed top-2 right-4 z-10 text-xs tabular-nums text-slate-400 dark:text-slate-500">
        {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
      </div>
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
