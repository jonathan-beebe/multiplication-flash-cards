import { useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import HardModeQuizBoard from "@/components/multiplication/HardModeQuizBoard";
import Card from "@/components/Card";
import type { CardAnimationProps } from "@/components/multiplication/QuizBoard";
import type { SubtractionQuestion } from "@/lib/subtraction/subtractionGenerator";
import { createSubtractionGenerator } from "@/lib/subtraction/subtractionGenerator";
import { useOperationGameEngine } from "@/lib/engine/useOperationGameEngine";
import { parseOperationLevel, SUBTRACTION_LEVEL_RANGES } from "@/lib/engine/operationLevels";

function renderQuestion(q: SubtractionQuestion, animProps: CardAnimationProps) {
  return <Card display={<>{q.a}<br/>−&nbsp;{q.b}</>} srText={`${q.a} minus ${q.b}`} contentClassName="text-right" {...animProps} />;
}

function HardModePractice() {
  const { level: levelParam } = useParams<{ level: string }>();
  const level = parseOperationLevel(levelParam);
  const { aMin, aMax, bMax } = SUBTRACTION_LEVEL_RANGES[level];
  const generator = useMemo(() => createSubtractionGenerator(aMin, aMax, bMax), [aMin, aMax, bMax]);
  const engine = useOperationGameEngine(generator);

  useEffect(() => {
    document.title = "Hard Mode — Subtraction Flash Cards";
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
    <main className="flex h-dvh items-center justify-center bg-background px-4 overflow-hidden">
      <NavBar />
      <HardModeQuizBoard
        generator={generator}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default HardModePractice;
