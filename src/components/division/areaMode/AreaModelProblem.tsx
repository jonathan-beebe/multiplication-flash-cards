import { useState, useRef, useEffect, useCallback, useReducer } from 'react'
import {
  getHelpfulFacts,
  validatePartialQuotient,
  validateSummingAnswer,
} from '@/lib/division/areaMode/divisionProblem'
import type { Level } from '@/lib/division/areaMode/divisionProblem'
import { createAreaModelSession, areaModelSessionReducer } from '@/lib/division/areaMode/areaModelState'
import ErrorText from '@/components/atoms/ErrorText'
import PrimaryButton from '@/components/atoms/PrimaryButton'
import NumberInput, { parseInputValue } from '@/components/atoms/NumberInput'
import SuccessText from '@/components/atoms/SuccessText'
import ProblemHeading from '@/components/atoms/ProblemHeading'
import Subheading from '@/components/atoms/Subheading'
import AreaModelRect from '@/components/division/areaMode/AreaModelRect'
import { buildAreaModelSummary } from '@/lib/division/displaySummary'

interface AreaModelProblemProps {
  level: Level
}

export default function AreaModelProblem({ level }: AreaModelProblemProps) {
  const [session, dispatch] = useReducer(areaModelSessionReducer, level, createAreaModelSession)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [hintsOpen, setHintsOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  const { problem, sections, remaining, phase, announcement } = session

  // Focus the input whenever the phase changes (building or summing),
  // or the "Next problem" button when done. The delay prevents the Enter
  // keyup from immediately activating the newly focused button.
  useEffect(() => {
    if (phase === 'done') {
      const id = setTimeout(() => nextButtonRef.current?.focus(), 50)
      return () => clearTimeout(id)
    } else {
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [phase])

  function triggerShake() {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 400)
  }

  const handleSubmit = useCallback(() => {
    const value = parseInputValue(inputValue)
    if (value === null) return

    if (phase === 'building') {
      const result = validatePartialQuotient(value, problem.divisor, remaining)
      if (!result.valid) {
        triggerShake()
        setInputError(result.error)
        inputRef.current?.focus()
        return
      }
      setInputValue('')
      setInputError(null)
      dispatch({ type: 'SUBMIT_BUILDING', partialQuotient: value })
    } else if (phase === 'summing') {
      const result = validateSummingAnswer(value, problem.quotient)
      if (!result.valid) {
        triggerShake()
        setInputError(result.error)
        inputRef.current?.focus()
        return
      }
      setInputValue('')
      setInputError(null)
      dispatch({ type: 'SUBMIT_SUMMING' })
    }
  }, [inputValue, phase, problem.divisor, problem.quotient, remaining])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  function handleNext() {
    setInputValue('')
    setInputError(null)
    setHintsOpen(false)
    dispatch({ type: 'NEXT', level })
  }

  const helpfulFacts = getHelpfulFacts(problem.divisor, problem.dividend)
  const sumEquation = sections.map((s) => s.partialQuotient.toLocaleString()).join(' + ')

  return (
    <div className="w-full max-w-xl flex flex-col gap-6">
      {/* Screen reader announcements */}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>

      {/* Problem heading */}
      <div className="text-center">
        <ProblemHeading aria-label={`${problem.dividend} divided by ${problem.divisor}`}>
          {problem.dividend.toLocaleString()} ÷ {problem.divisor} = ?
        </ProblemHeading>
      </div>

      {/* Area model rectangle */}
      <AreaModelRect divisor={problem.divisor} dividend={problem.dividend} sections={sections} remaining={remaining} />
      <p className="sr-only">{buildAreaModelSummary(sections, remaining, problem.dividend)}</p>

      {/* Building phase */}
      {phase === 'building' && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-base text-slate-600 dark:text-slate-400">
            {problem.divisor} × <span className="font-bold text-text">?</span> = how much of{' '}
            <span className="font-bold tabular-nums text-text">{remaining.toLocaleString()}</span> can you fill?
          </p>

          <div className={`flex gap-3 justify-center ${isShaking ? 'shake' : ''}`}>
            <NumberInput
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setInputError(null)
              }}
              onKeyDown={handleKeyDown}
              aria-label="Enter a partial quotient"
              aria-describedby={inputError ? 'input-error' : undefined}
              error={!!inputError}
            />
            <PrimaryButton onClick={handleSubmit}>Place</PrimaryButton>
          </div>

          {inputError && <ErrorText id="input-error">{inputError}</ErrorText>}
        </div>
      )}

      {/* Summing phase */}
      {phase === 'summing' && (
        <div className="flex flex-col gap-3">
          <Subheading className="text-center" aria-label={`Add the partial quotients: ${sumEquation} equals what?`}>
            {sumEquation} = ?
          </Subheading>

          <div className={`flex gap-3 justify-center ${isShaking ? 'shake' : ''}`}>
            <NumberInput
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setInputError(null)
              }}
              onKeyDown={handleKeyDown}
              aria-label="Enter the sum of partial quotients"
              aria-describedby={inputError ? 'input-error' : undefined}
              error={!!inputError}
            />
            <PrimaryButton onClick={handleSubmit}>Check</PrimaryButton>
          </div>

          {inputError && <ErrorText id="input-error">{inputError}</ErrorText>}
        </div>
      )}

      {/* Done phase */}
      {phase === 'done' && (
        <div className="flex flex-col items-center gap-4">
          <SuccessText
            aria-label={`${problem.dividend} divided by ${problem.divisor} equals ${problem.quotient}, correct`}>
            <span aria-hidden="true">
              {problem.dividend.toLocaleString()} ÷ {problem.divisor} = {problem.quotient.toLocaleString()} ✓
            </span>
          </SuccessText>
          <PrimaryButton ref={nextButtonRef} onClick={handleNext} aria-label="Next problem" size="lg">
            <span aria-hidden="true">Next problem →</span>
          </PrimaryButton>
        </div>
      )}

      {/* Helpful facts panel */}
      {phase !== 'done' && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setHintsOpen((o) => !o)}
            aria-expanded={hintsOpen}
            aria-controls="hints-panel"
            className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span>Helpful facts for {problem.divisor}</span>
            <span className="text-xs" aria-hidden="true">
              {hintsOpen ? '▲ hide' : '▼ show'}
            </span>
          </button>

          {hintsOpen && (
            <div id="hints-panel" className="grid grid-cols-3 gap-x-2 gap-y-1 p-3 bg-slate-50 dark:bg-slate-800/50">
              {helpfulFacts.map(({ multiplier, product }) => (
                <div key={multiplier} className="text-center text-sm tabular-nums text-slate-600 dark:text-slate-400">
                  {problem.divisor} × {multiplier} = {product.toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
