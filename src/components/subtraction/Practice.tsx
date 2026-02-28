import { useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import QuizBoard from "@/components/multiplication/QuizBoard";
import Card from "@/components/Card";
import type { CardAnimationProps } from "@/components/multiplication/QuizBoard";
import type { SubtractionQuestion } from "@/lib/subtractionGenerator";
import { subtractionGenerator } from "@/lib/subtractionGenerator";
import { useSubtractionGameEngine } from "@/lib/useSubtractionGameEngine";

function renderQuestion(q: SubtractionQuestion, animProps: CardAnimationProps) {
  return <Card display={`${q.a} − ${q.b}`} srText={`${q.a} minus ${q.b}`} {...animProps} />;
}

function Practice() {
  const engine = useSubtractionGameEngine();

  useEffect(() => {
    document.title = "Practice — Subtraction Flash Cards";
    engine.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.start]);

  const handleAnswer = useCallback(
    (question: SubtractionQuestion, correct: boolean, durationMs: number) => {
      engine.recordResult(question, correct, durationMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine.recordResult],
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <NavBar />
      <QuizBoard
        generator={subtractionGenerator}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default Practice;
