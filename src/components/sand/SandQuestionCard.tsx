import { useEffect, useRef, useState } from 'react'
import { cardBaseClasses } from '@/components/cardClasses'
import type { GradientStop } from '@/lib/sand/number/gradientPalette'
import SandDigits from './SandDigits'

/** Quiz-driven display phase: question → green ✓ (correct) → next question. */
export type SandQuestionPhase = 'idle' | 'correct' | 'advancing'

interface SandQuestionCardProps {
  /** The question to show — during 'advancing' this is already the next one. */
  display: string
  /** Spoken form of `display`, e.g. "7 times 8". */
  srText: string
  phase: SandQuestionPhase
  /** Monotonic count of wrong answers; each increment flashes the red ✗. */
  wrongSignal?: number
  /** Fires once the morph to the next question has had time to form. */
  onAdvanceDone?: () => void
}

const CORRECT_MARK = '✓'
const WRONG_MARK = '✗'
// Bottom → top stops matching the app's correct/wrong tokens
// (green-700 → green-500, red-700 → red-500).
const GREEN_GRADIENT: readonly GradientStop[] = [
  [0.08, 0.5, 0.24],
  [0.13, 0.77, 0.37],
]
const RED_GRADIENT: readonly GradientStop[] = [
  [0.73, 0.11, 0.11],
  [0.94, 0.27, 0.27],
]
/** How long the red ✗ holds before morphing back to the same question. */
const WRONG_FLASH_MS = 700
/** How long the morph toward the next question runs before the quiz settles. */
const ADVANCE_MORPH_MS = 700

/**
 * The #sand experiment's question card: the standard card shell around a
 * dark stage of sand-particle digits. Feedback is a cloud morph — the
 * question's grains reform into a green ✓ or red ✗, then into the next (or
 * same) question. One persistent WebGL renderer; no model swaps.
 */
export default function SandQuestionCard({
  display,
  srText,
  phase,
  wrongSignal = 0,
  onAdvanceDone,
}: SandQuestionCardProps) {
  // The ✗ flash is derived: active while the latest wrong answer hasn't been
  // cleared by its timer. Derivation keeps the flash in the same render as
  // the signal change; only the timer writes state.
  const [clearedSignal, setClearedSignal] = useState(wrongSignal)
  const wrongFlash = wrongSignal > clearedSignal
  const onAdvanceDoneRef = useRef(onAdvanceDone)
  useEffect(() => {
    onAdvanceDoneRef.current = onAdvanceDone
  })

  // Each wrong answer flashes the ✗, then morphs back to the same question.
  useEffect(() => {
    if (wrongSignal === 0) return
    const id = setTimeout(() => setClearedSignal(wrongSignal), WRONG_FLASH_MS)
    return () => clearTimeout(id)
  }, [wrongSignal])

  // The damped morph has no completion event; settle on a timer once the
  // next question has had time to form.
  useEffect(() => {
    if (phase !== 'advancing') return
    const id = setTimeout(() => onAdvanceDoneRef.current?.(), ADVANCE_MORPH_MS)
    return () => clearTimeout(id)
  }, [phase])

  const showWrong = phase === 'idle' && wrongFlash
  const text = phase === 'correct' ? CORRECT_MARK : showWrong ? WRONG_MARK : display
  const gradient = phase === 'correct' ? GREEN_GRADIENT : showWrong ? RED_GRADIENT : undefined
  const sr = phase === 'correct' ? 'Correct' : showWrong ? 'Incorrect, try again' : srText

  return (
    <div className={cardBaseClasses}>
      <div className="absolute inset-2 overflow-hidden rounded-xl bg-slate-900">
        <SandDigits text={text} srText={sr} gradient={gradient} cameraDistance={12} />
      </div>
    </div>
  )
}
