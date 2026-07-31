import { describe, expect, it, afterEach } from 'vitest'
import { parseSandFlag, isSandCardsEnabled, setSandCardsEnabledForTesting } from './featureFlags'

describe('parseSandFlag', () => {
  it('matches the bare flag', () => {
    expect(parseSandFlag('#sand')).toBe(true)
  })

  it('matches the flag among ampersand-separated values', () => {
    expect(parseSandFlag('#sand&other')).toBe(true)
    expect(parseSandFlag('#other&sand')).toBe(true)
  })

  it('rejects empty and unrelated hashes', () => {
    expect(parseSandFlag('')).toBe(false)
    expect(parseSandFlag('#')).toBe(false)
    expect(parseSandFlag('#other')).toBe(false)
  })

  it('rejects partial matches', () => {
    expect(parseSandFlag('#sandbox')).toBe(false)
    expect(parseSandFlag('#quicksand')).toBe(false)
  })
})

describe('isSandCardsEnabled', () => {
  afterEach(() => {
    setSandCardsEnabledForTesting(false)
  })

  it('defaults off', () => {
    expect(isSandCardsEnabled()).toBe(false)
  })

  it('reflects the test override', () => {
    setSandCardsEnabledForTesting(true)
    expect(isSandCardsEnabled()).toBe(true)
  })
})
