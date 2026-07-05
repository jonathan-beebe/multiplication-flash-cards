import { describe, it, expect } from 'vitest'
import { generateOffsetChoices } from './offsetChoices'

describe('generateOffsetChoices', () => {
  it('returns three unique choices including the correct answer', () => {
    for (const correct of [0, 1, 7, 42, 9999]) {
      const choices = generateOffsetChoices(correct)
      expect(choices).toHaveLength(3)
      expect(new Set(choices).size).toBe(3)
      expect(choices).toContain(correct)
    }
  })

  it('never produces negative choices', () => {
    for (const correct of [0, 1, 2]) {
      for (const choice of generateOffsetChoices(correct)) {
        expect(choice).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
