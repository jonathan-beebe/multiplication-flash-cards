// Alphabet-wide glyph measurements for the sand displays: one rasterized
// profile per glyph plus the single shared normalization the whole alphabet
// renders at, so a ':' sampled next to an '8' keeps its true relative size
// instead of being blown up to full glyph scale by its own bounding box.

import { prepareGlyphProfile, type GlyphProfile } from '../model3d/glyphSampler'
import { profileWidthPx, sharedNorm } from './digitField'

export interface GlyphMetrics {
  /** Rasterized profile per glyph; null where the raster is unavailable. */
  profileOf(glyph: string): GlyphProfile | null
  /** The one world-units-per-pixel normalization shared by the alphabet. */
  norm: number
  /** Rendered glyph width in world units (fallback: the unit-disc diameter). */
  widthOf(glyph: string): number
  /** Opaque-pixel count — the grain-allocation weight proxy for glyph area. */
  areaOf(glyph: string): number
}

/** Rasterize and measure an alphabet once, at the given glyph half-extent. */
export function prepareGlyphMetrics(alphabet: string[], scale: number): GlyphMetrics {
  const profiles = new Map<string, GlyphProfile | null>()
  for (const glyph of alphabet) profiles.set(glyph, prepareGlyphProfile(glyph, scale))
  const known = [...profiles.values()].filter((p): p is GlyphProfile => p !== null)
  const norm = sharedNorm(
    known.map((p) => p.scale / p.norm),
    scale,
  )
  return {
    profileOf: (glyph) => profiles.get(glyph) ?? null,
    norm,
    widthOf(glyph) {
      const profile = profiles.get(glyph)
      return profile ? profileWidthPx(profile) * norm : 2
    },
    areaOf(glyph) {
      const profile = profiles.get(glyph)
      return profile ? profile.opaqueX.length : 1
    },
  }
}
