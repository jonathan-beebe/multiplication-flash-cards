import { generateProblem } from '@/lib/division/divisionProblem'
import type { Level, Problem, Section } from '@/lib/division/divisionProblem'

export type Phase = 'building' | 'summing' | 'done'

export interface AreaModelSessionState {
  problem: Problem
  sections: Section[]
  remaining: number
  phase: Phase
  announcement: string
}

export type AreaModelAction =
  { type: 'SUBMIT_BUILDING'; partialQuotient: number } | { type: 'SUBMIT_SUMMING' } | { type: 'NEXT'; level: Level }

export function createAreaModelSession(level: Level): AreaModelSessionState {
  const problem = generateProblem(level)
  return {
    problem,
    sections: [],
    remaining: problem.dividend,
    phase: 'building',
    announcement: '',
  }
}

export function areaModelSessionReducer(state: AreaModelSessionState, action: AreaModelAction): AreaModelSessionState {
  switch (action.type) {
    case 'SUBMIT_BUILDING': {
      const { problem, sections } = state
      const area = action.partialQuotient * problem.divisor
      const newSections = [...sections, { partialQuotient: action.partialQuotient, area }]
      const newRemaining = state.remaining - area

      if (newRemaining === 0) {
        const nextPhase: Phase = newSections.length === 1 ? 'done' : 'summing'
        const announcement =
          nextPhase === 'summing'
            ? `${area.toLocaleString()} placed. Rectangle complete. Now add up the partial quotients.`
            : `Correct! ${problem.dividend.toLocaleString()} divided by ${problem.divisor} equals ${problem.quotient}.`
        return { ...state, sections: newSections, remaining: 0, phase: nextPhase, announcement }
      }

      return {
        ...state,
        sections: newSections,
        remaining: newRemaining,
        announcement: `${area.toLocaleString()} placed. ${newRemaining.toLocaleString()} remaining.`,
      }
    }

    case 'SUBMIT_SUMMING': {
      const { problem } = state
      return {
        ...state,
        phase: 'done',
        announcement: `Correct! ${problem.dividend.toLocaleString()} divided by ${problem.divisor} equals ${problem.quotient}.`,
      }
    }

    case 'NEXT':
      return createAreaModelSession(action.level)
  }
}
