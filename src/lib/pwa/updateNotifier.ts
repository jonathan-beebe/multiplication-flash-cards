type Listener = () => void

let pendingUpdateFn: (() => void) | null = null
const listeners = new Set<Listener>()

export function notifyUpdateAvailable(fn: () => void): void {
  pendingUpdateFn = fn
  listeners.forEach((l) => l())
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isUpdateAvailable(): boolean {
  return pendingUpdateFn !== null
}

export function applyUpdate(): void {
  pendingUpdateFn?.()
}
