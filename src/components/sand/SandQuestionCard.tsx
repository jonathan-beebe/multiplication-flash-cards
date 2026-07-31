import { cardBaseClasses } from '@/components/cardClasses'
import SandDigits from './SandDigits'

interface SandQuestionCardProps {
  /** Display string, e.g. "7 × 8". */
  display: string
  /** Spoken form, e.g. "7 times 8". */
  srText: string
  /** True while the quiz's exit animation runs; blows the sand off to the right. */
  dismissing: boolean
  /** The quiz's settle signal — fires once the sand is gone. */
  onDismissComplete?: () => void
}

/**
 * The #sand experiment's question card: the standard card shell around a
 * dark stage of sand-particle digits. Replaces the two-card CSS stack — one
 * persistent WebGL renderer, model swapped per question.
 */
export default function SandQuestionCard({ display, srText, dismissing, onDismissComplete }: SandQuestionCardProps) {
  return (
    <div className={cardBaseClasses}>
      <div className="absolute inset-2 overflow-hidden rounded-xl bg-slate-900">
        <SandDigits
          text={display}
          srText={srText}
          cameraDistance={12}
          dismissing={dismissing}
          onDismissComplete={onDismissComplete}
        />
      </div>
    </div>
  )
}
