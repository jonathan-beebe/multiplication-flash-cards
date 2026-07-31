import { useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import NavBar from '@/components/NavBar'
import QuizBoard from '@/components/quiz/QuizBoard'
import { useOperationGameEngine } from '@/lib/engine/useOperationGameEngine'
import { parseOperationLevel } from '@/lib/engine/operationLevels'
import { backNavProps, type OperationConfig } from './operationConfig'

interface OperationPracticeProps<Q> {
  config: OperationConfig<Q>
}

function OperationPractice<Q>({ config }: OperationPracticeProps<Q>) {
  const { level: levelParam } = useParams<{ level: string }>()
  const level = parseOperationLevel(levelParam)
  const generator = useMemo(() => config.makeGenerator(level), [config, level])
  const engine = useOperationGameEngine(generator)

  useEffect(() => {
    document.title = `Practice — ${config.name} Flash Cards`
    engine.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.name, engine.start])

  const handleAnswer = useCallback(
    (question: Q, correct: boolean, durationMs: number) => {
      engine.recordResult(question, correct, durationMs)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine.recordResult],
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <NavBar {...backNavProps(config, level)} />
      <QuizBoard
        generator={generator}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={config.renderQuestion}
        sandDisplayText={config.sandDisplayText}
        onAnswer={handleAnswer}
      />
    </main>
  )
}

export default OperationPractice
