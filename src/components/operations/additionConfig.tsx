import { createAdditionGenerator, type AdditionQuestion } from '@/lib/addition/additionGenerator'
import { ADDITION_LEVEL_RANGES } from '@/lib/engine/operationLevels'
import { makeStackedCardRenderer, type OperationConfig } from './operationConfig'

export const additionConfig: OperationConfig<AdditionQuestion> = {
  name: 'Addition',
  routeBase: '/addition',
  color: 'green',
  makeGenerator: (level) => {
    const { aMin, aMax, bMin, bMax } = ADDITION_LEVEL_RANGES[level]
    return createAdditionGenerator(aMin, aMax, bMin, bMax)
  },
  renderQuestion: makeStackedCardRenderer('+', 'plus'),
}
