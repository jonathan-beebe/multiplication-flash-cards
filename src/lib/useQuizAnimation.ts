import { useState, useCallback, useRef, useEffect } from 'react'
import type { CardAnimationProps } from '@/components/quiz/QuizBoard'

interface UseQuizAnimationOptions<Q> {
  getNextQuestion: () => Q
  onSettled: (nextQuestion: Q) => void
  delayMs?: number
}

interface UseQuizAnimationResult<Q> {
  nextQuestion: Q | null
  showCorrect: boolean
  isAnimating: boolean
  frontCardProps: CardAnimationProps
  backCardProps: CardAnimationProps
  triggerCorrect: () => void
}

export function useQuizAnimation<Q>({
  getNextQuestion,
  onSettled,
  delayMs = 300,
}: UseQuizAnimationOptions<Q>): UseQuizAnimationResult<Q> {
  const [nextQuestion, setNextQuestion] = useState<Q | null>(null)
  const [showCorrect, setShowCorrect] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideRotation, setSlideRotation] = useState(0)

  const onSettledRef = useRef(onSettled)
  useEffect(() => {
    onSettledRef.current = onSettled
  }, [onSettled])

  const getNextQuestionRef = useRef(getNextQuestion)
  useEffect(() => {
    getNextQuestionRef.current = getNextQuestion
  }, [getNextQuestion])

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const triggerCorrect = useCallback(() => {
    setShowCorrect(true)
    timeoutRef.current = setTimeout(() => {
      setNextQuestion(getNextQuestionRef.current())
      setSlideRotation(Math.random() * 70 - 35)
      setIsAnimating(true)
      setShowCorrect(false)
    }, delayMs)
  }, [delayMs])

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== 'transform') return
      const settled = nextQuestion!
      setNextQuestion(null)
      setIsAnimating(false)
      onSettledRef.current(settled)
    },
    [nextQuestion],
  )

  const frontCardProps: CardAnimationProps = {
    className: isAnimating ? 'card-slide-out' : undefined,
    style: {
      zIndex: 2,
      ...(isAnimating && {
        transform: `translateX(calc(50vw + 100%)) rotate(${slideRotation}deg)`,
      }),
    },
    onTransitionEnd: isAnimating ? handleTransitionEnd : undefined,
  }

  const backCardProps: CardAnimationProps = {
    'aria-hidden': true,
    className: isAnimating ? 'card-zoom-in' : undefined,
    style: { zIndex: 1, transform: isAnimating ? undefined : 'scale(0.8)' },
  }

  return { nextQuestion, showCorrect, isAnimating, frontCardProps, backCardProps, triggerCorrect }
}
