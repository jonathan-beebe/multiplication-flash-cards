import { useEffect, useRef } from 'react'
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
  /** Fires once the morph to the next question has had time to form. */
  onAdvanceDone?: () => void
}

const CORRECT_MARK = '✓'
// Bottom → top stops matching the app's correct tokens
// (green-700 → green-500).
const GREEN_GRADIENT: readonly GradientStop[] = [
  [0.08, 0.5, 0.24],
  [0.13, 0.77, 0.37],
]
/** How long the morph toward the next question runs before the quiz settles. */
const ADVANCE_MORPH_MS = 700

/**
 * The #sand experiment's question display: sand-particle digits floating
 * directly on the page — no card shell. Fills its parent, so the host owns
 * the stage size. Correct-answer feedback is a cloud morph — the question's
 * grains reform into a green ✓, then into the next question. A wrong answer
 * leaves the question in place; feedback lives on the answer buttons. One
 * persistent WebGL renderer; no model swaps.
 */
export default function SandQuestionCard({ display, srText, phase, onAdvanceDone }: SandQuestionCardProps) {
  const onAdvanceDoneRef = useRef(onAdvanceDone)
  useEffect(() => {
    onAdvanceDoneRef.current = onAdvanceDone
  })

  // The damped morph has no completion event; settle on a timer once the
  // next question has had time to form.
  useEffect(() => {
    if (phase !== 'advancing') return
    const id = setTimeout(() => onAdvanceDoneRef.current?.(), ADVANCE_MORPH_MS)
    return () => clearTimeout(id)
  }, [phase])

  const text = phase === 'correct' ? CORRECT_MARK : display
  const gradient = phase === 'correct' ? GREEN_GRADIENT : undefined
  const sr = phase === 'correct' ? 'Correct' : srText

  return (
    // Flex centering serves the no-WebGL fallback span; the WebGL container
    // is h-full/w-full and fills the stage either way.
    <div className="flex h-full w-full items-center justify-center">
      <SandDigits text={text} srText={sr} gradient={gradient} cameraDistance={12} fitToView={0.9} />
    </div>
  )
}
