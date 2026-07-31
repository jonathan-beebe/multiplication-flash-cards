// WebGL availability probe for the sand display. The typeof guard matters:
// jsdom defines no WebGLRenderingContext, so tests short-circuit here without
// ever calling jsdom's getContext stub (which logs, and test-setup fails any
// test that touches console.error). Cached — support can't change mid-session.

let cached: boolean | null = null

export function canRenderSand(): boolean {
  if (cached === null) {
    if (typeof WebGLRenderingContext === 'undefined') {
      cached = false
    } else {
      try {
        const canvas = document.createElement('canvas')
        cached = canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null
      } catch {
        cached = false
      }
    }
  }
  return cached
}
