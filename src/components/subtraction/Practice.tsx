import { useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import QuizBoard from "@/components/multiplication/QuizBoard";
import Card from "@/components/Card";
import type { CardAnimationProps } from "@/components/multiplication/QuizBoard";
import type { SubtractionQuestion } from "@/lib/subtraction/subtractionGenerator";
import { createSubtractionGenerator } from "@/lib/subtraction/subtractionGenerator";
import { useOperationGameEngine } from "@/lib/engine/useOperationGameEngine";
import { parseOperationLevel, SUBTRACTION_LEVEL_RANGES } from "@/lib/engine/operationLevels";

function renderQuestion(q: SubtractionQuestion, animProps: CardAnimationProps) {
  return <Card display={<>{q.a}<br/>−&nbsp;{q.b}</>} srText={`${q.a} minus ${q.b}`} contentClassName="text-right" {...animProps} />;
}

function Practice() {
  const { level: levelParam } = useParams<{ level: string }>();
  const level = parseOperationLevel(levelParam);
  const { aMin, aMax, bMin, bMax } = SUBTRACTION_LEVEL_RANGES[level];
  const generator = useMemo(() => createSubtractionGenerator(aMin, aMax, bMin, bMax), [aMin, aMax, bMin, bMax]);
  const engine = useOperationGameEngine(generator);

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
        generator={generator}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default Practice;
