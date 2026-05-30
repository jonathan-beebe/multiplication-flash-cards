import { describe, it, expect } from 'vitest'
import { OPERATION_LEVELS, OPERATION_LEVEL_IDS } from '@/lib/engine/operationLevels'

describe('OPERATION_LEVELS', () => {
  it('uses operation-neutral descriptions so they read correctly for any operation', () => {
    for (const id of OPERATION_LEVEL_IDS) {
      const { description } = OPERATION_LEVELS[id]
      expect(description, `${id} description`).not.toMatch(/[+\-−×÷*/]/)
    }
  })

  it('gives every level a non-empty label and description', () => {
    for (const id of OPERATION_LEVEL_IDS) {
      const { label, description } = OPERATION_LEVELS[id]
      expect(label, `${id} label`).not.toBe('')
      expect(description, `${id} description`).not.toBe('')
    }
  })
})
