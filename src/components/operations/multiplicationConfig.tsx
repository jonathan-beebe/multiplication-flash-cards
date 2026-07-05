import Card from '@/components/Card'
import { createMultiplicationGenerator, type Question } from '@/lib/multiplication/multiplicationGenerator'
import { MULTIPLICATION_LEVEL_RANGES } from '@/lib/engine/operationLevels'
import type { OperationConfig } from './operationConfig'

export const multiplicationConfig: OperationConfig<Question> = {
  name: 'Multiplication',
  routeBase: '/multiplication',
  color: 'amber',
  makeGenerator: (level) => {
    const { aMin, aMax, bMin, bMax } = MULTIPLICATION_LEVEL_RANGES[level]
    return createMultiplicationGenerator(aMin, aMax, bMin, bMax)
  },
  renderQuestion: (q, animProps) => <Card display={`${q.a} × ${q.b}`} srText={`${q.a} times ${q.b}`} {...animProps} />,
}
