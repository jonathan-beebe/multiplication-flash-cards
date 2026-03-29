import { useState, useCallback, useRef, useEffect } from 'react'
import NumberInput, { parseInputValue } from '@/components/atoms/NumberInput'
import type { QuestionGenerator } from '@/lib/engine/gameEngine'
import type { CardAnimationProps } from '@/components/quiz/QuizBoard'
import { useAnnouncement } from '@/lib/useAnnouncement'

interface HardModeQuizBoardProps<Q> {
  generator: QuestionGenerator<Q>
  getNextQuestion: () => Q
  renderQuestion: (question: Q, animProps: CardAnimationProps) => React.ReactNode
  onAnswer?: (question: Q, correct: boolean, durationMs: number) => void
  now?: () => number
}

export default function HardModeQuizBoard<Q>({
  generator,
  getNextQuestion,
  renderQuestion,
  onAnswer,
  now = Date.now,
}: HardModeQuizBoardProps<Q>) {
  const [question, setQuestion] = useState<Q>(() => getNextQuestion())
  const wrongGuessesRef = useRef<number[]>([])
  const questionStartRef = useRef<number>(now())
  const [nextQuestion, setNextQuestion] = useState<Q | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [showCorrect, setShowCorrect] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideRotation, setSlideRotation] = useState(0)
  const { announcement, announce } = useAnnouncement()
  const inputRef = useRef<HTMLInputElement>(null)
  const lockedRef = useRef(false)
  const mountedRef = useRef(false)
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const correctTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(id)
  }, [])

  useEffect(
    () => () => {
      clearTimeout(shakeTimeoutRef.current)
      clearTimeout(correctTimeoutRef.current)
    },
    [],
  )

  function triggerShake() {
    setIsShaking(true)
    shakeTimeoutRef.current = setTimeout(() => setIsShaking(false), 400)
  }

  const handleSubmit = useCallback(() => {
    if (isAnimating || showCorrect) return

    const value = parseInputValue(inputValue)
    if (value === null) return

    if (generator.evaluate(question, value)) {
      const durationMs = now() - questionStartRef.current
      onAnswer?.(question, wrongGuessesRef.current.length === 0, durationMs)
      setInputError(null)
      setShowCorrect(true)
      lockedRef.current = true
      announce(`Correct! ${generator.displayText(question)} equals ${value}.`)
      // Intentionally captures getNextQuestion at call time, not at timeout time.
      // This ensures the next question is selected without the just-recorded answer,
      // so the same question isn't immediately resurfaced after a wrong answer.
      correctTimeoutRef.current = setTimeout(() => {
        const next = getNextQuestion()
        setNextQuestion(next)
        setSlideRotation(Math.random() * 70 - 35)
        setIsAnimating(true)
      }, 300)
    } else {
      wrongGuessesRef.current.push(value)
      triggerShake()
      setInputValue('')
      setInputError('Try again')
      announce(`${value} is incorrect. Try again.`)
      inputRef.current?.focus()
    }
  }, [inputValue, isAnimating, showCorrect, question, announce, onAnswer, generator, now, getNextQuestion])

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== 'transform') return
      setQuestion(nextQuestion!)
      setNextQuestion(null)
      setInputValue('')
      setInputError(null)
      setShowCorrect(false)
      setIsAnimating(false)
    },
    [nextQuestion],
  )

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    lockedRef.current = false
    wrongGuessesRef.current = []
    questionStartRef.current = now()
    const id = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(id)
  }, [question, now])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  const backQuestion = nextQuestion ?? question

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
      <div className="card-stack" style={{ height: 150 }}>
        {renderQuestion(backQuestion, {
          'aria-hidden': true,
          className: isAnimating ? 'card-zoom-in' : undefined,
          style: { zIndex: 1, transform: isAnimating ? undefined : 'scale(0.8)' },
        })}
        {renderQuestion(question, {
          className: isAnimating ? 'card-slide-out' : undefined,
          style: {
            zIndex: 2,
            ...(isAnimating && {
              transform: `translateX(calc(50vw + 100%)) rotate(${slideRotation}deg)`,
            }),
          },
          onTransitionEnd: isAnimating ? handleTransitionEnd : undefined,
        })}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className={`flex gap-3 justify-center ${isShaking ? 'shake' : ''}`}>
          <NumberInput
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              if (lockedRef.current) return
              setInputValue(e.target.value)
              setInputError(null)
            }}
            onKeyDown={handleKeyDown}
            aria-label="Enter your answer"
            aria-describedby="answer-feedback"
            focusColor="indigo"
            error={!!inputError}
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchEnd={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            onClick={handleSubmit}
            disabled={showCorrect || isAnimating}
            aria-label="Check answer"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-5 py-2 shadow-md transition-all disabled:opacity-50">
            Check
          </button>
        </div>

        <p
          id="answer-feedback"
          className={`text-center text-sm font-medium min-h-[1.25rem] ${
            showCorrect
              ? 'font-bold text-green-600 dark:text-green-400'
              : inputError
                ? 'text-red-600 dark:text-red-400'
                : ''
          }`}
          role={inputError ? 'alert' : undefined}>
          {showCorrect ? 'Correct!' : (inputError ?? '\u00A0')}
        </p>
      </div>
    </div>
  )
}
