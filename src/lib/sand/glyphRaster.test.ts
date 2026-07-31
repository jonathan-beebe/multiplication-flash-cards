import { describe, expect, it } from 'vitest'
import {
  appendSymbolFallback,
  extractMaskAndSources,
  staticGlyphFontFamily,
  SYMBOL_FALLBACK_FAMILIES,
} from './glyphRaster'

function makeRgba(w: number, h: number, fill: (x: number, y: number) => number): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const off = (y * w + x) * 4
      const a = fill(x, y)
      rgba[off] = 255
      rgba[off + 1] = 255
      rgba[off + 2] = 255
      rgba[off + 3] = a
    }
  }
  return rgba
}

describe('extractMaskAndSources', () => {
  it('returns an empty result for an all-transparent image', () => {
    const rgba = makeRgba(4, 4, () => 0)
    const out = extractMaskAndSources(rgba, 4, 4)
    expect(out.sourceLen).toBe(0)
    expect(out.mask.every((v) => v === 0)).toBe(true)
  })

  it('marks every pixel above the threshold and records its (x, y)', () => {
    // A 2x2 opaque block at (1,1)–(2,2) in a 4x4 image.
    const rgba = makeRgba(4, 4, (x, y) => (x >= 1 && x <= 2 && y >= 1 && y <= 2 ? 255 : 0))
    const out = extractMaskAndSources(rgba, 4, 4)
    expect(out.sourceLen).toBe(4)
    // Mask indices should be exactly the 4 opaque cells.
    const opaqueIndices = [1 * 4 + 1, 1 * 4 + 2, 2 * 4 + 1, 2 * 4 + 2]
    for (const idx of opaqueIndices) expect(out.mask[idx]).toBe(1)
    // Source coords cover those four cells (order is row-major).
    expect(Array.from(out.sourceX)).toEqual([1, 2, 1, 2])
    expect(Array.from(out.sourceY)).toEqual([1, 1, 2, 2])
  })

  it('respects the alpha threshold (strictly greater than)', () => {
    const rgba = makeRgba(2, 2, () => 80)
    const out = extractMaskAndSources(rgba, 2, 2, 80)
    expect(out.sourceLen).toBe(0)

    const rgba2 = makeRgba(2, 2, () => 81)
    const out2 = extractMaskAndSources(rgba2, 2, 2, 80)
    expect(out2.sourceLen).toBe(4)
  })
})

describe('appendSymbolFallback', () => {
  it('appends the symbol fallback chain to a caller font', () => {
    expect(appendSymbolFallback('16px Inter')).toBe(`16px Inter, ${SYMBOL_FALLBACK_FAMILIES}`)
  })

  it('is idempotent when the caller already named a symbol family', () => {
    const already = `16px "Apple Symbols", serif`
    expect(appendSymbolFallback(already)).toBe(already)
  })
})

describe('staticGlyphFontFamily', () => {
  it('appends the symbol fallback after the inherited page family', () => {
    // The crux of BUG-004: the motion-off span must route missing-symbol
    // codepoints through the same fallback chain the rasterizer uses, so
    // it renders the same glyph as the sand silhouette instead of tofu.
    expect(staticGlyphFontFamily('system-ui, sans-serif')).toBe(`system-ui, sans-serif, ${SYMBOL_FALLBACK_FAMILIES}`)
  })

  it('preserves the inherited family as the primary so ordinary text still matches CSS', () => {
    expect(staticGlyphFontFamily('Inter')).toBe(`Inter, ${SYMBOL_FALLBACK_FAMILIES}`)
  })

  it('falls back to the symbol families alone when no family is inherited', () => {
    expect(staticGlyphFontFamily('')).toBe(SYMBOL_FALLBACK_FAMILIES)
    expect(staticGlyphFontFamily('   ')).toBe(SYMBOL_FALLBACK_FAMILIES)
  })

  it('is idempotent when a symbol family is already present', () => {
    const already = `"Apple Symbols", serif`
    expect(staticGlyphFontFamily(already)).toBe(already)
  })
})
