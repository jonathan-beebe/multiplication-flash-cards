import type { ReactNode } from 'react'
import Card from '@/components/Card'
import type { CardAnimationProps } from '@/components/quiz/QuizBoard'
import type { QuestionGenerator } from '@/lib/engine/gameEngine'
import type { OperationLevel } from '@/lib/engine/operationLevels'

/**
 * Everything operation-specific that the generic operation screens
 * (OperationMenu, OperationPractice, OperationHardModePractice,
 * OperationDrill) need. Adding a quiz-style operation means providing one of
 * these, a question generator, and routes in the composition root.
 */
export interface OperationConfig<Q> {
  /** Display name used in document titles and back labels, e.g. 'Addition'. */
  name: string
  /** Route base for menu and back navigation, e.g. '/addition'. */
  routeBase: string
  /** Accent color for this operation's menu buttons and level picker. */
  color: 'green' | 'rose' | 'amber'
  makeGenerator: (level: OperationLevel) => QuestionGenerator<Q>
  renderQuestion: (question: Q, animProps: CardAnimationProps) => ReactNode
  /**
   * Single-line question string for the #sand experiment's particle display
   * ("7 × 8" — alphabet: digits, × + − ÷, space). Omitted, the flag has no
   * effect on this operation.
   */
  sandDisplayText?: (question: Q) => string
}

/** NavBar props leading back to the operation's level menu. */
export function backNavProps<Q>(config: OperationConfig<Q>, level: OperationLevel) {
  return { backTo: `${config.routeBase}/${level}`, backLabel: `Back to ${config.name}` }
}

interface StackedQuestion {
  a: number
  b: number
}

/**
 * Question renderer for operations displayed as a stacked two-row card
 * (addition, subtraction). `srConnector` is the spoken operator, e.g. 'plus'.
 */
export function makeStackedCardRenderer(symbol: string, srConnector: string) {
  return function renderStackedQuestion(q: StackedQuestion, animProps: CardAnimationProps): ReactNode {
    return (
      <Card
        display={
          <>
            {q.a}
            <br />
            {symbol}&nbsp;{q.b}
          </>
        }
        srText={`${q.a} ${srConnector} ${q.b}`}
        contentClassName="text-right"
        {...animProps}
      />
    )
  }
}
