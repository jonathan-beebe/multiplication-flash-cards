// Tiny numeric primitives shared by both sand backends (glyph2d core and
// the three planet). Kept at the `src/sand/` level — sibling to
// `motionMode.ts` — so neither backend grows its own copy (RFCTR-002).

/** Clamp `v` into the inclusive range `[lo, hi]`. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/**
 * Return a Fisher–Yates shuffle of `[0, n)` as an `Int32Array`. `rng` is
 * injectable so callers can seed it for deterministic tests; pass
 * `Math.random` for production randomness.
 */
export function shuffledRange(n: number, rng: () => number): Int32Array {
  const order = new Int32Array(n)
  for (let i = 0; i < n; i++) order[i] = i
  for (let i = n - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0
    const tmp = order[i]
    order[i] = order[j]
    order[j] = tmp
  }
  return order
}
