import { useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import HardModeQuizBoard from "@/components/multiplication/HardModeQuizBoard";
import Card from "@/components/Card";
import type { CardAnimationProps } from "@/components/multiplication/QuizBoard";
import type { Question } from "@/lib/multiplicationGenerator";
import { multiplicationGenerator } from "@/lib/multiplicationGenerator";
import { useMultiplicationGameEngine } from "@/lib/useMultiplicationGameEngine";

function renderQuestion(q: Question, animProps: CardAnimationProps) {
  return <Card a={q.a} b={q.b} {...animProps} />;
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
