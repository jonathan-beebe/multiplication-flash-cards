import { describe, expect, it } from 'vitest'
import { sampleGradient, type GradientStop } from './gradientPalette'

const FIRE: GradientStop[] = [
  [1, 0, 0],
  [1, 0.5, 0],
  [1, 1, 0],
]

function sampled(stops: readonly GradientStop[], t: number): number[] {
  const out = [0, 0, 0]
  sampleGradient(stops, t, out, 0)
  return out
}

describe('sampleGradient', () => {
  it('returns the exact stops at their evenly spaced positions', () => {
    expect(sampled(FIRE, 0)).toEqual([1, 0, 0])
    expect(sampled(FIRE, 0.5)).toEqual([1, 0.5, 0])
    expect(sampled(FIRE, 1)).toEqual([1, 1, 0])
  })

  it('blends linearly inside a segment', () => {
    // Midway through the lower segment: halfway between red and orange.
    expect(sampled(FIRE, 0.25)).toEqual([1, 0.25, 0])
    // Midway through the upper segment: halfway between orange and yellow.
    expect(sampled(FIRE, 0.75)).toEqual([1, 0.75, 0])
  })

  it('picks the right segment among many stops', () => {
    const four: GradientStop[] = [
      [0, 0, 0],
      [0.3, 0, 0],
      [0.6, 0, 0],
      [0.9, 0, 0],
    ]
    // t = 0.5 sits halfway between the 2nd (t=1/3) and 3rd (t=2/3) stops.
    expect(sampled(four, 0.5)[0]).toBeCloseTo(0.45, 10)
  })

  it('clamps t outside 0..1 to the end stops', () => {
    expect(sampled(FIRE, -0.4)).toEqual([1, 0, 0])
    expect(sampled(FIRE, 1.7)).toEqual([1, 1, 0])
  })

  it('treats a single stop as a solid color', () => {
    expect(sampled([[0.2, 0.4, 0.6]], 0)).toEqual([0.2, 0.4, 0.6])
    expect(sampled([[0.2, 0.4, 0.6]], 1)).toEqual([0.2, 0.4, 0.6])
  })

  it('writes at the given offset and leaves neighbors untouched', () => {
    const out = new Float32Array(9).fill(9)
    sampleGradient(FIRE, 1, out, 3)
    expect([...out]).toEqual([9, 9, 9, 1, 1, 0, 9, 9, 9])
  })
})
