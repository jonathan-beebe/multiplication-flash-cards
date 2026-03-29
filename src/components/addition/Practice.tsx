import { useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import NavBar from '@/components/NavBar'
import QuizBoard from '@/components/quiz/QuizBoard'
import Card from '@/components/Card'
import type { CardAnimationProps } from '@/components/quiz/QuizBoard'
import type { AdditionQuestion } from '@/lib/addition/additionGenerator'
import { createAdditionGenerator } from '@/lib/addition/additionGenerator'
import { useOperationGameEngine } from '@/lib/engine/useOperationGameEngine'
import { parseOperationLevel, ADDITION_LEVEL_RANGES } from '@/lib/engine/operationLevels'

function renderQuestion(q: AdditionQuestion, animProps: CardAnimationProps) {
  return (
    <Card
      display={
        <>
          {q.a}
          <br />
          +&nbsp;{q.b}
        </>
      }
      srText={`${q.a} plus ${q.b}`}
      contentClassName="text-right"
      {...animProps}
    />
  )
}

function Practice() {
  const { level: levelParam } = useParams<{ level: string }>()
  const level = parseOperationLevel(levelParam)
  const { aMin, aMax, bMin, bMax } = ADDITION_LEVEL_RANGES[level]
  const generator = useMemo(() => createAdditionGenerator(aMin, aMax, bMin, bMax), [aMin, aMax, bMin, bMax])
  const engine = useOperationGameEngine(generator)

  useEffect(() => {
    document.title = 'Practice — Addition Flash Cards'
    engine.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.start])

  const handleAnswer = useCallback(
    (question: AdditionQuestion, correct: boolean, durationMs: number) => {
      engine.recordResult(question, correct, durationMs)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine.recordResult],
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <NavBar backTo={`/addition/${level}`} backLabel="Back to Addition" />
      <QuizBoard
        generator={generator}
        getNextQuestion={engine.getNextQuestion}
        renderQuestion={renderQuestion}
        onAnswer={handleAnswer}
      />
    </main>
  )
}

export default Practice
