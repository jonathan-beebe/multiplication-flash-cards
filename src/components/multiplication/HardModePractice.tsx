import { useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import HardModeQuizBoard from "@/components/multiplication/HardModeQuizBoard";
import type { Question } from "@/components/multiplication/QuizBoard";
import { useMultiplicationGameEngine } from "@/lib/useMultiplicationGameEngine";

function HardModePractice() {
  const engine = useMultiplicationGameEngine();

  useEffect(() => {
    document.title = "Hard Mode — Multiplication Flash Cards";
    engine.start();
  }, [engine.start]);

  const handleAnswer = useCallback(
    (question: Question, wrongAnswers: number[]) => {
      engine.recordResult(question, wrongAnswers);
    },
    [engine.recordResult]
  );

  return (
    <main className="flex h-dvh items-center justify-center bg-background px-4 overflow-hidden">
      <NavBar />
      <HardModeQuizBoard
        getNextQuestion={engine.getNextQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default HardModePractice;
