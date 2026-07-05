import { createSubtractionGenerator, type SubtractionQuestion } from '@/lib/subtraction/subtractionGenerator'
import { SUBTRACTION_LEVEL_RANGES } from '@/lib/engine/operationLevels'
import { makeStackedCardRenderer, type OperationConfig } from './operationConfig'

export const subtractionConfig: OperationConfig<SubtractionQuestion> = {
  name: 'Subtraction',
  routeBase: '/subtraction',
  color: 'rose',
  makeGenerator: (level) => {
    const { aMin, aMax, bMin, bMax } = SUBTRACTION_LEVEL_RANGES[level]
    return createSubtractionGenerator(aMin, aMax, bMin, bMax)
  },
  renderQuestion: makeStackedCardRenderer('−', 'minus'),
}
