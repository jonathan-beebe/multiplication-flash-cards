import { generateProblem } from '@/lib/division/areaMode/divisionProblem'
import type { Level, Problem, Section } from '@/lib/division/areaMode/divisionProblem'

export type Phase = 'building' | 'summing' | 'done'

export interface SessionState {
  problem: Problem
  sections: Section[]
  phase: Phase
  announcement: string
}

export type SessionAction =
  | { type: 'SUBMIT_BUILDING'; partialQuotient: number }
  | { type: 'SUBMIT_SUMMING' }
  | { type: 'NEXT'; level: Level }

export function createSession(level: Level): SessionState {
  const problem = generateProblem(level)
  return {
    problem,
    sections: [],
    phase: 'building',
    announcement: '',
  }
}

export function computeRemaining(problem: Problem, sections: Section[]): number {
  return problem.dividend - sections.reduce((acc, s) => acc + s.area, 0)
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SUBMIT_BUILDING': {
      const { problem, sections } = state
      const area = action.partialQuotient * problem.divisor
      const newSections = [...sections, { partialQuotient: action.partialQuotient, area }]
      const newRemaining = computeRemaining(problem, newSections)

      if (newRemaining === 0) {
        const nextPhase: Phase = newSections.length === 1 ? 'done' : 'summing'
        const announcement =
          nextPhase === 'summing'
            ? `${area.toLocaleString()} subtracted. Remainder is 0. Now add the partial quotients.`
            : `Correct! ${problem.dividend.toLocaleString()} divided by ${problem.divisor} equals ${problem.quotient}.`
        return { ...state, sections: newSections, phase: nextPhase, announcement }
      }

      return {
        ...state,
        sections: newSections,
        announcement: `${area.toLocaleString()} subtracted. ${newRemaining.toLocaleString()} remaining.`,
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
      return createSession(action.level)
  }
}
