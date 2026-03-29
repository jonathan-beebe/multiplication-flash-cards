import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import QuizButton from '@/components/quiz/QuizButton'
import type { QuestionGenerator } from '@/lib/engine/gameEngine'
import { useAnnouncement } from '@/lib/useAnnouncement'
import { useQuizAnimation } from '@/lib/useQuizAnimation'

export interface CardAnimationProps {
  className?: string
  style?: React.CSSProperties
  onTransitionEnd?: React.TransitionEventHandler<HTMLDivElement>
  'aria-hidden'?: boolean | 'true' | 'false'
}

interface QuizBoardProps<Q> {
  generator: QuestionGenerator<Q>
  getNextQuestion: () => Q
  renderQuestion: (question: Q, animProps: CardAnimationProps) => React.ReactNode
  onCorrect?: () => void
  onWrong?: () => void
  onAnswer?: (question: Q, correct: boolean, durationMs: number) => void
  now?: () => number
}

export default function QuizBoard<Q>({
  generator,
  getNextQuestion,
  renderQuestion,
  onCorrect,
  onWrong,
  onAnswer,
  now = Date.now,
}: QuizBoardProps<Q>) {
  const [question, setQuestion] = useState<Q>(() => getNextQuestion())
  const [wrongAnswers, setWrongAnswers] = useState<Set<number>>(new Set())
  const { announcement, announce } = useAnnouncement()
  const choicesRef = useRef<HTMLDivElement>(null)
  const questionStartRef = useRef<number>(now())
  const mountedRef = useRef(false)

  const { nextQuestion, showCorrect, isAnimating, frontCardProps, backCardProps, triggerCorrect } = useQuizAnimation({
    getNextQuestion,
    onSettled: (nextQ) => {
      setQuestion(nextQ)
      setWrongAnswers(new Set())
    },
  })

  const choices = useMemo(() => {
    return generator.generateChoices(question)
  }, [question, generator])

  const handleAnswer = useCallback(
    (answer: number) => {
      if (generator.evaluate(question, answer)) {
        const durationMs = now() - questionStartRef.current
        onAnswer?.(question, wrongAnswers.size === 0, durationMs)
        onCorrect?.()
        triggerCorrect()
      } else {
        if (!wrongAnswers.has(answer)) {
          onWrong?.()
          announce(`${answer} is incorrect. Try again.`)
        }
        setWrongAnswers((prev) => new Set(prev).add(answer))
      }
    },
    [generator, question, wrongAnswers, onCorrect, onWrong, onAnswer, triggerCorrect, announce, now],
  )

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    questionStartRef.current = now()
    const announceId = setTimeout(() => {
      announce(`Correct! Next question: ${generator.displayText(question)}`)
    }, 0)
    const focusId = setTimeout(() => {
      choicesRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
    }, 0)
    return () => {
      clearTimeout(announceId)
      clearTimeout(focusId)
    }
  }, [question, announce, generator, now])

  const backQuestion = nextQuestion ?? question

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
      <div className="card-stack">
        {renderQuestion(backQuestion, backCardProps)}
        {renderQuestion(question, frontCardProps)}
      </div>
      <div
        ref={choicesRef}
        className={`flex flex-wrap justify-center gap-3 transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        {choices.map((choice) => {
          const isWrong = wrongAnswers.has(choice)
          const isCorrectChoice = showCorrect && generator.evaluate(question, choice)
          const fadeOut = (showCorrect || isAnimating) && !isCorrectChoice
          return (
            <QuizButton
              key={choice}
              value={choice}
              onClick={() => handleAnswer(choice)}
              disabled={isWrong || showCorrect || isAnimating}
              state={isCorrectChoice ? 'correct' : isWrong ? 'wrong' : fadeOut ? 'fade-out' : 'default'}
            />
          )
        })}
      </div>
    </div>
  )
}
