import Card from '@/components/Card'
import { multiplicationGenerator, type Question } from '@/lib/multiplication/multiplicationGenerator'
import type { OperationConfig } from './operationConfig'

export const multiplicationConfig: OperationConfig<Question> = {
  name: 'Multiplication',
  routeBase: '/multiplication',
  // Multiplication has no difficulty levels yet (see FEAT-001); the generator
  // adapts within a single fixed range.
  hasLevels: false,
  makeGenerator: () => multiplicationGenerator,
  renderQuestion: (q, animProps) => <Card display={`${q.a} × ${q.b}`} srText={`${q.a} times ${q.b}`} {...animProps} />,
}
