// The gradient contract for the sand glyph displays: an ordered list of RGB
// stops, bottom → top, sampled piecewise-linearly by normalized vertical
// position. The library owns only this mapping; palettes themselves (which
// colors, how many stops) belong to the caller.

/** One gradient color stop, RGB with each channel in 0..1. */
export type GradientStop = readonly [number, number, number]

/**
 * Sample evenly spaced bottom→top `stops` at `t` (clamped to 0..1) and write
 * the RGB result into `out` at `outIndex`. Allocation-free — the glyph slab
 * calls this per grain per frame.
 */
export function sampleGradient(
  stops: readonly GradientStop[],
  t: number,
  out: Float32Array | number[],
  outIndex: number,
): void {
  const last = stops.length - 1
  const position = Math.min(1, Math.max(0, t)) * last
  const lower = Math.min(last, Math.floor(position))
  const upper = Math.min(last, lower + 1)
  const blend = position - lower
  const a = stops[lower]
  const b = stops[upper]
  out[outIndex + 0] = a[0] + (b[0] - a[0]) * blend
  out[outIndex + 1] = a[1] + (b[1] - a[1]) * blend
  out[outIndex + 2] = a[2] + (b[2] - a[2]) * blend
}
