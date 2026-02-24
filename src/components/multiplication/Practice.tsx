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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.start]);

  const handleAnswer = useCallback(
    (question: Question, correct: boolean) => {
      engine.recordResult(question, correct);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
