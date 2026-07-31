// Shared motion-mode contract for the sand factories.
//
// Each public factory (`createSandPlanet`, `createSandGlyph`,
// `createSandText`) accepts a `motionMode` option:
//   - `'auto'` (default) — respect `prefers-reduced-motion: reduce`.
//   - `'animated'` — always run the animation, ignoring the OS preference.
//   - `'static'` — always present the calm fallback (single frame for the
//     planet, plain DOM glyph/heading for the glyph2d adapters), even
//     when the OS preference allows motion.
//
// The demo's motion toggle drives `'animated'` / `'static'` from outside;
// consumers building their own toggle do the same.

export type MotionMode = 'auto' | 'animated' | 'static'

/**
 * Runtime motion-swap contract shared by every sand factory handle
 * (`SandGlyph`, `SandText`, `SandPlanet`). One method shape across all
 * backends so a consumer's motion toggle drives them uniformly (RFCTR-004).
 */
export interface MotionSwappable {
  /**
   * Switch presentation between animated and static at runtime. Resolves
   * `mode` and, when the resolved state changes, swaps the mounted path in
   * place — so a motion toggle can flip a live effect without the consumer
   * tearing down and recreating the handle. A no-op when the resolved mode
   * is unchanged.
   */
  setMotionMode(mode: MotionMode): void
}

/**
 * The single reduced-motion detector for the whole library. Every place
 * that needs to know the OS preference (the factories via
 * `resolveMotionMode`, the demo's toggle seed) routes through here so there
 * is exactly one media query read — see BUG-003.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Resolve a user-facing `MotionMode` to the binary state the factories run. */
export function resolveMotionMode(mode: MotionMode): 'animated' | 'static' {
  if (mode === 'animated') return 'animated'
  if (mode === 'static') return 'static'
  return prefersReducedMotion() ? 'static' : 'animated'
}

/**
 * Map a binary animate/don't-animate choice onto the `MotionMode`
 * contract. Consumers driving their own toggle (e.g. the demo) convert
 * their toggle state to a boolean at the call site, so demo-specific
 * state types never leak into the library (RFCTR-001).
 */
export function motionModeFor(animated: boolean): MotionMode {
  return animated ? 'animated' : 'static'
}
