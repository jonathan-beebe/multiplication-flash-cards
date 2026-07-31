import { describe, expect, it } from 'vitest'
import { clamp, shuffledRange } from './mathUtils'

describe('clamp', () => {
  it('returns the value when already in range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to the lower and upper bounds', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })

  it('returns the bound at the inclusive edges', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('shuffledRange', () => {
  // A fixed-sequence rng makes the shuffle deterministic. Math.random is
  // never called, so each test is reproducible.
  function seqRng(values: number[]): () => number {
    let i = 0
    return () => values[i++ % values.length]
  }

  it('returns a permutation of [0, n) — every index exactly once', () => {
    const out = shuffledRange(6, seqRng([0.1, 0.9, 0.5, 0.3, 0.7]))
    expect([...out].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('is deterministic under a seeded rng', () => {
    const a = shuffledRange(8, seqRng([0.2, 0.8, 0.4, 0.6, 0.1]))
    const b = shuffledRange(8, seqRng([0.2, 0.8, 0.4, 0.6, 0.1]))
    expect([...a]).toEqual([...b])
  })

  it('handles n=0 and n=1', () => {
    expect([...shuffledRange(0, Math.random)]).toEqual([])
    expect([...shuffledRange(1, Math.random)]).toEqual([0])
  })
})
