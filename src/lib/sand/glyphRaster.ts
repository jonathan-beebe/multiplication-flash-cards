// Shared glyph rasterize + extract core. Both backends — the glyph2d
// sampler and the model3d glyphSampler — rasterize a unicode glyph
// into an offscreen 2D canvas and extract its opaque pixels through this
// one implementation, so the symbol fallback chain, the font-metric
// baseline, the extraction routine, and the alpha/font constants live in
// exactly one place instead of drifting across the two backends
// (RFCTR-003). Sibling to `motionMode.ts` / `mathUtils.ts`.

export const ALPHA_THRESHOLD = 80
export const GLYPH_FONT_RATIO = 0.78
// Symbol-rich families appended to the caller's font chain (or used
// standalone when the caller passes no font). Many of the glyphs the
// library targets — zodiac signs (♈–♓), the Aesculapius staff (⚕),
// planet symbols — aren't present in Inter or what generic `sans-serif`
// resolves to, so without this fallback the canvas would rasterize a
// tofu square. Ordered by platform: Apple Symbols (macOS) → Segoe UI
// Symbol (Windows) → Noto Sans Symbols (Linux), with `serif` terminating
// the chain so something always renders.
export const SYMBOL_FALLBACK_FAMILIES =
  '"Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Noto Sans Symbols", serif'

export interface ExtractedMask {
  /** 1-byte-per-pixel silhouette, indexed [y * w + x]. */
  mask: Uint8Array
  /** Mask-local coords of every opaque pixel. */
  sourceX: Int16Array
  sourceY: Int16Array
  sourceLen: number
}

export interface RasterizedGlyph extends ExtractedMask {
  /** Mask dimensions, in canvas pixels. */
  maskW: number
  maskH: number
}

export interface RasterizeOptions {
  /** CSS font shorthand; the symbol fallback chain is appended to it. */
  font?: string
  /** Override the alpha cutoff (0–255). Default 80. */
  alphaThreshold?: number
}

/**
 * Walk an RGBA image and return the silhouette mask plus parallel arrays
 * of (x, y) for every opaque pixel. Pure — exported for unit tests.
 */
export function extractMaskAndSources(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  threshold: number = ALPHA_THRESHOLD,
): ExtractedMask {
  const mask = new Uint8Array(w * h)
  const xs: number[] = []
  const ys: number[] = []
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const idx = py * w + px
      if (rgba[idx * 4 + 3] > threshold) {
        mask[idx] = 1
        xs.push(px)
        ys.push(py)
      }
    }
  }
  return {
    mask,
    sourceX: Int16Array.from(xs),
    sourceY: Int16Array.from(ys),
    sourceLen: xs.length,
  }
}

/**
 * Rasterize a single glyph into a square `sizePx × sizePx` mask, centered
 * horizontally with the alphabetic baseline placed from font metrics
 * (`ascent + (h - ascent - descent) / 2`) so the silhouette matches a
 * `text-align: center; line-height: 1` DOM glyph, then extract its opaque
 * pixels. Returns null when no 2D context is available or nothing drew.
 */
export function rasterizeGlyph(glyph: string, sizePx: number, options: RasterizeOptions = {}): RasterizedGlyph | null {
  const w = Math.max(1, Math.round(sizePx))
  const h = w
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = options.font
    ? appendSymbolFallback(options.font)
    : `${Math.round(w * GLYPH_FONT_RATIO)}px ${SYMBOL_FALLBACK_FAMILIES}`
  // Canvas's textBaseline='middle' uses the em-square center as the
  // reference, which paints ~5–10 px higher than a flex-centered DOM glyph
  // for symbol fonts where ascent + descent ≠ em-size. Compute the actual
  // alphabetic baseline from font metrics so the silhouette matches.
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(glyph)
  const ascent = m.fontBoundingBoxAscent
  const descent = m.fontBoundingBoxDescent
  const baselineY = Number.isFinite(ascent) && Number.isFinite(descent) ? ascent + (h - ascent - descent) / 2 : h * 0.82
  ctx.fillText(glyph, w / 2, baselineY)

  const rgba = ctx.getImageData(0, 0, w, h).data
  const extracted = extractMaskAndSources(rgba, w, h, options.alphaThreshold)
  if (extracted.sourceLen === 0) return null
  return { ...extracted, maskW: w, maskH: h }
}

// CSS font-family chains continue past terminators like `sans-serif` only
// for codepoints the resolved font lacks, so appending the symbol families
// to the end of the caller's chain catches obscure glyphs without
// disturbing per-codepoint resolution for anything Inter or system-ui
// already covers. Idempotent: skip when the caller already named one.
export function appendSymbolFallback(font: string): string {
  if (font.includes('Apple Symbols')) return font
  return `${font}, ${SYMBOL_FALLBACK_FAMILIES}`
}

/**
 * Resolve the `font-family` for the motion-off static DOM glyph so it
 * routes symbol codepoints through the SAME fallback chain the rasterizer
 * appends (BUG-004). `inheritedFamily` is the family the static span would
 * otherwise inherit from the page (read via `getComputedStyle`); keeping
 * it as the primary family preserves CSS resolution for ordinary text,
 * while the appended symbol families catch glyphs the page font lacks —
 * matching the sand silhouette instead of rendering tofu / a stand-in
 * glyph. Falls back to the symbol families alone when no inherited family
 * is available. This is `font-family` only — the static span keeps its
 * layout-driven size; `appendSymbolFallback` (which expects a full
 * shorthand) is the animated-canvas counterpart.
 */
export function staticGlyphFontFamily(inheritedFamily: string): string {
  const base = inheritedFamily.trim()
  if (!base) return SYMBOL_FALLBACK_FAMILIES
  return appendSymbolFallback(base)
}
