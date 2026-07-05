import { useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import NavBar from '@/components/NavBar'
import HardModeQuizBoard from '@/components/quiz/HardModeQuizBoard'
import { useOperationGameEngine } from '@/lib/engine/useOperationGameEngine'
import { parseOperationLevel } from '@/lib/engine/operationLevels'
import { backNavProps, type OperationConfig } from './operationConfig'

interface OperationHardModePracticeProps<Q> {
  config: OperationConfig<Q>
}

function OperationHardModePractice<Q>({ config }: OperationHardModePracticeProps<Q>) {
  const { level: levelParam } = useParams<{ level: string }>()
  const level = parseOperationLevel(levelParam)
  const generator = useMemo(() => config.makeGenerator(level), [config, level])
  const engine = useOperationGameEngine(generator)

  useEffect(() => {
    document.title = `Hard Mode — ${config.name} Flash Cards`
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
    <main className="flex h-dvh items-center justify-center bg-background px-4 overflow-hidden">
      <NavBar {...backNavProps(config, level)} />
      <HardModeQuizBoard
        generator={generator}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={config.renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  )
}

export default OperationHardModePractice
