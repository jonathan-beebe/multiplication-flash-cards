import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import QuizBoard from "@/components/multiplication/QuizBoard";
import type { Question } from "@/components/multiplication/QuizBoard";
import DrillTimerBar from "@/components/multiplication/DrillTimerBar";
import { useMultiplicationGameEngine } from "@/lib/useMultiplicationGameEngine";

interface DrillProps {
  durationMinutes: number;
}

function Drill({ durationMinutes }: DrillProps) {
  const navigate = useNavigate();
  const engine = useMultiplicationGameEngine();
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);

  useEffect(() => {
    document.title = `${durationMinutes} Minute Drill — Multiplication Flash Cards`;
    engine.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes, engine.start]);

  const correctCountRef = useRef(0);
  const wrongCountRef = useRef(0);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0) {
      navigate("success", {
        state: { correctCount: correctCountRef.current, wrongCount: wrongCountRef.current },
        replace: true,
      });
    }
  }, [timeRemaining, navigate]);

  const handleCorrect = useCallback(() => {
    correctCountRef.current += 1;
  }, []);

  const handleWrong = useCallback(() => {
    wrongCountRef.current += 1;
  }, []);

  const handleAnswer = useCallback(
    (question: Question, correct: boolean) => {
      engine.recordResult(question, correct);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine.recordResult]
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <DrillTimerBar durationSeconds={durationMinutes * 60} />
      <div className="fixed top-2 right-4 z-10 text-xs tabular-nums text-slate-600 dark:text-slate-400">
        <span className="sr-only">Time remaining: </span>
        {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
      </div>
      <NavBar />
      <QuizBoard
        onCorrect={handleCorrect}
        onWrong={handleWrong}
        getNextQuestion={engine.getNextQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default Drill;
