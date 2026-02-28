import { useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import QuizBoard from "@/components/multiplication/QuizBoard";
import Card from "@/components/Card";
import type { CardAnimationProps } from "@/components/multiplication/QuizBoard";
import type { AdditionQuestion } from "@/lib/additionGenerator";
import { additionGenerator } from "@/lib/additionGenerator";
import { useAdditionGameEngine } from "@/lib/useAdditionGameEngine";

function renderQuestion(q: AdditionQuestion, animProps: CardAnimationProps) {
  return <Card display={`${q.a} + ${q.b}`} srText={`${q.a} plus ${q.b}`} {...animProps} />;
}

function Practice() {
  const engine = useAdditionGameEngine();

  useEffect(() => {
    document.title = "Practice — Addition Flash Cards";
    engine.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.start]);

  const handleAnswer = useCallback(
    (question: AdditionQuestion, correct: boolean, durationMs: number) => {
      engine.recordResult(question, correct, durationMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine.recordResult],
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <NavBar />
      <QuizBoard
        generator={additionGenerator}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default Practice;
