import { useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import QuizBoard from "@/components/multiplication/QuizBoard";
import type { Question } from "@/components/multiplication/QuizBoard";
import { useMultiplicationGameEngine } from "@/lib/useMultiplicationGameEngine";

function Practice() {
  const engine = useMultiplicationGameEngine();

  useEffect(() => {
    document.title = "Practice — Multiplication Flash Cards";
    engine.start();
  }, [engine.start]);

  const handleAnswer = useCallback(
    (question: Question, wrongAnswers: number[]) => {
      engine.recordResult(question, wrongAnswers);
    },
    [engine.recordResult]
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <NavBar />
      <QuizBoard
        getNextQuestion={engine.getNextQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default Practice;
