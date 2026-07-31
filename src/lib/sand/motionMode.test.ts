// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { motionModeFor, prefersReducedMotion, resolveMotionMode } from './motionMode'

// Stub `window.matchMedia` to report the given reduced-motion state. jsdom
// ships no matchMedia, so every test that touches the detector installs one.
function stubReducedMotion(reduce: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion: reduce') ? reduce : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('prefersReducedMotion', () => {
  it('is true when the OS asks for reduced motion', () => {
    stubReducedMotion(true)
    expect(prefersReducedMotion()).toBe(true)
  })

  it('is false when the OS allows motion', () => {
    stubReducedMotion(false)
    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('resolveMotionMode', () => {
  it('forces animated regardless of the OS preference', () => {
    stubReducedMotion(true)
    expect(resolveMotionMode('animated')).toBe('animated')
  })

  it('forces static regardless of the OS preference', () => {
    stubReducedMotion(false)
    expect(resolveMotionMode('static')).toBe('static')
  })

  it('auto follows the OS preference', () => {
    stubReducedMotion(false)
    expect(resolveMotionMode('auto')).toBe('animated')
    stubReducedMotion(true)
    expect(resolveMotionMode('auto')).toBe('static')
  })
})

describe('motionModeFor', () => {
  it('maps true to animated and false to static', () => {
    expect(motionModeFor(true)).toBe('animated')
    expect(motionModeFor(false)).toBe('static')
  })
})
