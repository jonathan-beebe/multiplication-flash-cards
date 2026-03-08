import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import QuizBoard from "@/components/quiz/QuizBoard";
import Card from "@/components/Card";
import type { CardAnimationProps } from "@/components/quiz/QuizBoard";
import DrillTimerBar from "@/components/quiz/DrillTimerBar";
import type { AdditionQuestion } from "@/lib/addition/additionGenerator";
import { createAdditionGenerator } from "@/lib/addition/additionGenerator";
import { useOperationGameEngine } from "@/lib/engine/useOperationGameEngine";
import { parseOperationLevel, ADDITION_LEVEL_RANGES } from "@/lib/engine/operationLevels";
import { useDrillTimer } from "@/lib/useDrillTimer";

interface DrillProps {
  durationMinutes: number;
}

function renderQuestion(q: AdditionQuestion, animProps: CardAnimationProps) {
  return <Card display={<>{q.a}<br/>+&nbsp;{q.b}</>} srText={`${q.a} plus ${q.b}`} contentClassName="text-right" {...animProps} />;
}

function Drill({ durationMinutes }: DrillProps) {
  const navigate = useNavigate();
  const { level: levelParam } = useParams<{ level: string }>();
  const level = parseOperationLevel(levelParam);
  const { aMin, aMax, bMin, bMax } = ADDITION_LEVEL_RANGES[level];
  const generator = useMemo(() => createAdditionGenerator(aMin, aMax, bMin, bMax), [aMin, aMax, bMin, bMax]);
  const engine = useOperationGameEngine(generator);
  const { timeRemaining, timerAnnouncement, recordCorrect, recordWrong } = useDrillTimer(
    durationMinutes,
    {
      onComplete: (correctCount, wrongCount) =>
        navigate("success", { state: { correctCount, wrongCount }, replace: true }),
    }
  );

  useEffect(() => {
    document.title = `${durationMinutes} Minute Drill — Addition Flash Cards`;
    engine.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes, engine.start]);

  const handleAnswer = useCallback(
    (question: AdditionQuestion, correct: boolean, durationMs: number) => {
      engine.recordResult(question, correct, durationMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine.recordResult],
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{timerAnnouncement}</span>
      <DrillTimerBar durationSeconds={durationMinutes * 60} />
      <div className="fixed top-2 right-4 z-10 text-xs tabular-nums text-slate-600 dark:text-slate-400">
        <span className="sr-only">Time remaining: </span>
        {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
      </div>
      <NavBar backTo={`/addition/${level}`} backLabel="Back to Addition" />
      <QuizBoard
        generator={generator}
        onCorrect={recordCorrect}
        onWrong={recordWrong}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default Drill;
