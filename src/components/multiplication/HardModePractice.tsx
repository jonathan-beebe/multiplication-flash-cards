import { useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import HardModeQuizBoard from "@/components/quiz/HardModeQuizBoard";
import Card from "@/components/Card";
import type { CardAnimationProps } from "@/components/quiz/QuizBoard";
import type { Question } from "@/lib/multiplication/multiplicationGenerator";
import { multiplicationGenerator } from "@/lib/multiplication/multiplicationGenerator";
import { useMultiplicationGameEngine } from "@/lib/multiplication/useMultiplicationGameEngine";

function renderQuestion(q: Question, animProps: CardAnimationProps) {
  return <Card display={`${q.a} × ${q.b}`} srText={`${q.a} times ${q.b}`} {...animProps} />;
}

function HardModePractice() {
  const engine = useMultiplicationGameEngine();

  useEffect(() => {
    document.title = "Hard Mode — Multiplication Flash Cards";
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
    <main className="flex h-dvh items-center justify-center bg-background px-4 overflow-hidden">
      <NavBar />
      <HardModeQuizBoard
        generator={multiplicationGenerator}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default HardModePractice;
