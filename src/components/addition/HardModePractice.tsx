import { useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import HardModeQuizBoard from "@/components/multiplication/HardModeQuizBoard";
import Card from "@/components/Card";
import type { CardAnimationProps } from "@/components/multiplication/QuizBoard";
import type { AdditionQuestion } from "@/lib/addition/additionGenerator";
import { createAdditionGenerator } from "@/lib/addition/additionGenerator";
import { useOperationGameEngine } from "@/lib/engine/useOperationGameEngine";
import { parseOperationLevel, ADDITION_LEVEL_RANGES } from "@/lib/engine/operationLevels";

function renderQuestion(q: AdditionQuestion, animProps: CardAnimationProps) {
  return <Card display={`${q.a} + ${q.b}`} srText={`${q.a} plus ${q.b}`} {...animProps} />;
}

function HardModePractice() {
  const { level: levelParam } = useParams<{ level: string }>();
  const level = parseOperationLevel(levelParam);
  const { aMin, aMax, bMin, bMax } = ADDITION_LEVEL_RANGES[level];
  const generator = useMemo(() => createAdditionGenerator(aMin, aMax, bMin, bMax), [aMin, aMax, bMin, bMax]);
  const engine = useOperationGameEngine(generator);

  useEffect(() => {
    document.title = "Hard Mode — Addition Flash Cards";
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
