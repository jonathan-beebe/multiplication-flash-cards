import { useState, useCallback, useMemo, useRef, useEffect, lazy, Suspense } from 'react'
import Card from '@/components/Card'
import QuizButton from '@/components/quiz/QuizButton'
import type { QuestionGenerator } from '@/lib/engine/gameEngine'
import { isSandCardsEnabled } from '@/lib/featureFlags'
import { useAnnouncement } from '@/lib/useAnnouncement'
import { useQuizAnimation } from '@/lib/useQuizAnimation'

// Lazy: the sand card pulls in three.js — flag-off users never fetch it.
const SandQuestionCard = lazy(() => import('@/components/sand/SandQuestionCard'))

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
  /** Enables the #sand experiment for this board (see OperationConfig.sandDisplayText). */
  sandDisplayText?: (question: Q) => string
  onCorrect?: () => void
  onWrong?: () => void
  onAnswer?: (question: Q, correct: boolean, durationMs: number) => void
  now?: () => number
}

export default function QuizBoard<Q>({
  generator,
  getNextQuestion,
  renderQuestion,
  sandDisplayText,
  onCorrect,
  onWrong,
  onAnswer,
  now = Date.now,
}: QuizBoardProps<Q>) {
  const [question, setQuestion] = useState<Q>(() => getNextQuestion())
  const [wrongAnswers, setWrongAnswers] = useState<Set<number>>(new Set())
  // Monotonic across questions — the sand card flashes ✗ on each increment.
  const [wrongCount, setWrongCount] = useState(0)
  const { announcement, announce } = useAnnouncement()
  const choicesRef = useRef<HTMLDivElement>(null)
  const questionStartRef = useRef<number>(now())
  const mountedRef = useRef(false)

  const sandMode = isSandCardsEnabled() && sandDisplayText !== undefined

  const { nextQuestion, showCorrect, isAnimating, frontCardProps, backCardProps, triggerCorrect, settleExit } =
    useQuizAnimation({
      getNextQuestion,
      onSettled: (nextQ) => {
        setQuestion(nextQ)
        setWrongAnswers(new Set())
      },
      // Sand mode holds the green ✓ through this window before morphing on.
      delayMs: sandMode ? 800 : undefined,
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
        setWrongCount((c) => c + 1)
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
        {sandMode ? (
          // One persistent renderer instead of the two-card stack. The cloud
          // morphs question → ✓/✗ → next (or same) question; the card's
          // advance timer calls settleExit to promote the question. During
          // 'advancing', backQuestion is already the next one, so the text
          // prop drives the morph.
          <Suspense fallback={<Card display={sandDisplayText(question)} srText={generator.displayText(question)} />}>
            <SandQuestionCard
              display={sandDisplayText(backQuestion)}
              srText={generator.displayText(backQuestion)}
              phase={isAnimating ? 'advancing' : showCorrect ? 'correct' : 'idle'}
              wrongSignal={wrongCount}
              onAdvanceDone={settleExit ?? undefined}
            />
          </Suspense>
        ) : (
          <>
            {renderQuestion(backQuestion, backCardProps)}
            {renderQuestion(question, frontCardProps)}
          </>
        )}
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
