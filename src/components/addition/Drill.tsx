import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import QuizBoard from "@/components/multiplication/QuizBoard";
import Card from "@/components/Card";
import type { CardAnimationProps } from "@/components/multiplication/QuizBoard";
import DrillTimerBar from "@/components/multiplication/DrillTimerBar";
import type { AdditionQuestion } from "@/lib/addition/additionGenerator";
import { createAdditionGenerator } from "@/lib/addition/additionGenerator";
import { useOperationGameEngine } from "@/lib/engine/useOperationGameEngine";
import { parseOperationLevel, ADDITION_LEVEL_RANGES } from "@/lib/engine/operationLevels";

interface DrillProps {
  durationMinutes: number;
}

function renderQuestion(q: AdditionQuestion, animProps: CardAnimationProps) {
  return <Card display={`${q.a} + ${q.b}`} srText={`${q.a} plus ${q.b}`} {...animProps} />;
}

function Drill({ durationMinutes }: DrillProps) {
  const navigate = useNavigate();
  const { level: levelParam } = useParams<{ level: string }>();
  const level = parseOperationLevel(levelParam);
  const { aMin, aMax, bMin, bMax } = ADDITION_LEVEL_RANGES[level];
  const generator = useMemo(() => createAdditionGenerator(aMin, aMax, bMin, bMax), [aMin, aMax, bMin, bMax]);
  const engine = useOperationGameEngine(generator);
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);

  useEffect(() => {
    document.title = `${durationMinutes} Minute Drill — Addition Flash Cards`;
    engine.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes, engine.start]);

  const correctCountRef = useRef(0);
  const wrongCountRef = useRef(0);

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0) {
      navigate("success", {
        state: { correctCount: correctCountRef.current, wrongCount: wrongCountRef.current },
        replace: true,
      });
    }
  }, [timeRemaining, navigate]);

  const handleCorrect = useCallback(() => { correctCountRef.current += 1; }, []);
  const handleWrong = useCallback(() => { wrongCountRef.current += 1; }, []);

  const handleAnswer = useCallback(
    (question: AdditionQuestion, correct: boolean, durationMs: number) => {
      engine.recordResult(question, correct, durationMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine.recordResult],
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <DrillTimerBar durationSeconds={durationMinutes * 60} />
      <div className="fixed top-2 right-4 z-10 text-xs tabular-nums text-slate-600 dark:text-slate-400">
        <span className="sr-only">Time remaining: </span>
        {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
      </div>
      <NavBar />
      <QuizBoard
        generator={generator}
        onCorrect={handleCorrect}
        onWrong={handleWrong}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  );
}

export default Drill;
