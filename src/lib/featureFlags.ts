// URL-hash feature flags, read once at app load. BrowserRouter never reads
// the hash and in-app navigations drop it, so the flag is captured eagerly
// and stays sticky for the session.

/** True when "sand" appears in a location hash like "#sand" or "#sand&other". */
export function parseSandFlag(hash: string): boolean {
  return hash.replace(/^#/, '').split('&').includes('sand')
}

let sandEnabled = typeof window !== 'undefined' && parseSandFlag(window.location.hash)

/** Sand-particle flashcard experiment: on when the URL had #sand at load. */
export function isSandCardsEnabled(): boolean {
  return sandEnabled
}

/** Test-only override; reset in afterEach. */
export function setSandCardsEnabledForTesting(value: boolean): void {
  sandEnabled = value
}
