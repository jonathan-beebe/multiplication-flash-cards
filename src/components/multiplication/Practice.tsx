import { useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import QuizBoard from "@/components/multiplication/QuizBoard";
import Card from "@/components/Card";
import type { CardAnimationProps } from "@/components/multiplication/QuizBoard";
import type { Question } from "@/lib/multiplicationGenerator";
import { multiplicationGenerator } from "@/lib/multiplicationGenerator";
import { useMultiplicationGameEngine } from "@/lib/useMultiplicationGameEngine";

function renderQuestion(q: Question, animProps: CardAnimationProps) {
  return <Card display={`${q.a} × ${q.b}`} srText={`${q.a} times ${q.b}`} {...animProps} />;
}

function Practice() {
  const engine = useMultiplicationGameEngine();

  useEffect(() => {
    document.title = "Practice — Multiplication Flash Cards";
    engine.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.start]);

  const handleAnswer = useCallback(
    (question: Question, correct: boolean, durationMs: number) => {
      engine.recordResult(question, correct, durationMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine.recordResult]
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <NavBar />
      <QuizBoard
        generator={multiplicationGenerator}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default Practice;
