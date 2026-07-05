import type { ReactNode } from 'react'
import Card from '@/components/Card'
import type { CardAnimationProps } from '@/components/quiz/QuizBoard'
import type { QuestionGenerator } from '@/lib/engine/gameEngine'
import type { OperationLevel } from '@/lib/engine/operationLevels'

/**
 * Everything operation-specific that the generic operation screens
 * (OperationPractice, OperationHardModePractice, OperationDrill) need.
 * Adding a quiz-style operation means providing one of these, a question
 * generator, and routes in the composition root.
 */
export interface OperationConfig<Q> {
  /** Display name used in document titles and back labels, e.g. 'Addition'. */
  name: string
  /** Route base for back navigation, e.g. '/addition'. */
  routeBase: string
  /** Whether this operation's routes carry a :level segment. */
  hasLevels: boolean
  makeGenerator: (level: OperationLevel) => QuestionGenerator<Q>
  renderQuestion: (question: Q, animProps: CardAnimationProps) => ReactNode
}

/**
 * NavBar props for an operation screen: level-scoped operations navigate back
 * to their level menu; the rest fall through to NavBar's Home default.
 */
export function backNavProps<Q>(config: OperationConfig<Q>, level: OperationLevel) {
  if (!config.hasLevels) return {}
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
