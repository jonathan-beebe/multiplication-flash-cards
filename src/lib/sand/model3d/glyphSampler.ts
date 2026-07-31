import { rasterizeGlyph } from '../glyphRaster'

const GLYPH_CANVAS_SIZE = 256

export type GlyphProfile = {
  opaqueX: Int16Array
  opaqueY: Int16Array
  cx: number
  cy: number
  norm: number
  scale: number
}

export function prepareGlyphProfile(glyph: string, scale: number): GlyphProfile | null {
  // Rasterize + extract via the shared core (font-metric baseline, full
  // symbol fallback chain). Derive the bounding-box centroid and
  // half-extent from the opaque-pixel arrays for 3D point placement.
  const raster = rasterizeGlyph(glyph, GLYPH_CANVAS_SIZE)
  if (!raster) return null

  const { sourceX, sourceY, sourceLen } = raster
  let minX = GLYPH_CANVAS_SIZE
  let maxX = 0
  let minY = GLYPH_CANVAS_SIZE
  let maxY = 0
  for (let i = 0; i < sourceLen; i++) {
    const px = sourceX[i]
    const py = sourceY[i]
    if (px < minX) minX = px
    if (px > maxX) maxX = px
    if (py < minY) minY = py
    if (py > maxY) maxY = py
  }

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const halfExtent = Math.max(maxX - minX, maxY - minY) / 2
  const norm = halfExtent > 0 ? scale / halfExtent : scale

  return {
    opaqueX: sourceX,
    opaqueY: sourceY,
    cx,
    cy,
    norm,
    scale,
  }
}

export function sampleFromProfile(
  profile: GlyphProfile | null,
  count: number,
  out: Float32Array = new Float32Array(count * 3),
): Float32Array {
  if (!profile) return fillCircle(out, count, 1)
  const { opaqueX, opaqueY, cx, cy, norm } = profile
  const len = opaqueX.length
  for (let i = 0; i < count; i++) {
    const idx = (Math.random() * len) | 0
    out[i * 3 + 0] = (opaqueX[idx] - cx) * norm
    out[i * 3 + 1] = -(opaqueY[idx] - cy) * norm
    out[i * 3 + 2] = 0
  }
  return out
}

export function sampleGlyph(glyph: string, count: number, scale: number): Float32Array {
  const profile = prepareGlyphProfile(glyph, scale)
  const out = new Float32Array(count * 3)
  if (!profile) return fillCircle(out, count, scale)
  return sampleFromProfile(profile, count, out)
}

function fillCircle(out: Float32Array, count: number, scale: number): Float32Array {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * scale
    out[i * 3 + 0] = Math.cos(angle) * r
    out[i * 3 + 1] = Math.sin(angle) * r
    out[i * 3 + 2] = 0
  }
  return out
}
