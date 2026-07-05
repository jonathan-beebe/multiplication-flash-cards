import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import NavBar from '@/components/NavBar'
import QuizBoard from '@/components/quiz/QuizBoard'
import DrillTimerBar from '@/components/quiz/DrillTimerBar'
import { useOperationGameEngine } from '@/lib/engine/useOperationGameEngine'
import { parseOperationLevel } from '@/lib/engine/operationLevels'
import { useDrillTimer } from '@/lib/useDrillTimer'
import { backNavProps, type OperationConfig } from './operationConfig'

interface OperationDrillProps<Q> {
  config: OperationConfig<Q>
  durationMinutes: number
}

function OperationDrill<Q>({ config, durationMinutes }: OperationDrillProps<Q>) {
  const navigate = useNavigate()
  const { level: levelParam } = useParams<{ level: string }>()
  const level = parseOperationLevel(levelParam)
  const generator = useMemo(() => config.makeGenerator(level), [config, level])
  const engine = useOperationGameEngine(generator)
  const { timeRemaining, timerAnnouncement, recordCorrect, recordWrong } = useDrillTimer(durationMinutes, {
    onComplete: (correctCount, wrongCount) =>
      navigate('success', { state: { correctCount, wrongCount }, replace: true }),
  })

  useEffect(() => {
    document.title = `${durationMinutes} Minute Drill — ${config.name} Flash Cards`
    engine.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes, config.name, engine.start])

  const handleAnswer = useCallback(
    (question: Q, correct: boolean, durationMs: number) => {
      engine.recordResult(question, correct, durationMs)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine.recordResult],
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {timerAnnouncement}
      </span>
      <DrillTimerBar durationSeconds={durationMinutes * 60} />
      <div className="fixed top-2 right-4 z-10 text-xs tabular-nums text-slate-600 dark:text-slate-400">
        <span className="sr-only">Time remaining: </span>
        {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
      </div>
      <NavBar {...backNavProps(config, level)} />
      <QuizBoard
        generator={generator}
        onCorrect={recordCorrect}
        onWrong={recordWrong}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={config.renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  )
}

export default OperationDrill
