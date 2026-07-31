// Local modification: the fitToView contain-fit math. The renderer itself
// needs WebGL, so only the pure scale computation is covered here.

import { describe, expect, it } from 'vitest'
import { fitViewScale } from './createSandRenderer'

describe('fitViewScale', () => {
  it('limits by width when the model is proportionally wider than the view', () => {
    expect(fitViewScale({ width: 8, height: 2 }, { width: 16, height: 12 }, 1)).toBe(2)
  })

  it('limits by height when the model is proportionally taller than the view', () => {
    expect(fitViewScale({ width: 2, height: 8 }, { width: 16, height: 12 }, 1)).toBe(1.5)
  })

  it('applies the fraction as margin', () => {
    expect(fitViewScale({ width: 4, height: 2 }, { width: 20, height: 10 }, 0.9)).toBeCloseTo(4.5)
  })

  it('returns null for degenerate bounds so callers keep their scale', () => {
    expect(fitViewScale({ width: 0, height: 2 }, { width: 16, height: 12 }, 1)).toBeNull()
    expect(fitViewScale({ width: 2, height: 0 }, { width: 16, height: 12 }, 1)).toBeNull()
  })
})
