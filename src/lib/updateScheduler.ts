let inGame = false
let pendingUpdate: (() => void) | null = null

/** Reset all state. For use in tests only. */
export function _reset(): void {
  inGame = false
  pendingUpdate = null
}

export function setInGame(value: boolean): void {
  inGame = value
  if (!inGame && pendingUpdate) {
    const fn = pendingUpdate
    pendingUpdate = null
    fn()
  }
}

export function scheduleUpdate(doUpdate: () => void): void {
  if (inGame) {
    pendingUpdate = doUpdate
  } else {
    doUpdate()
  }
}
