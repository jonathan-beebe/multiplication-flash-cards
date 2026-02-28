import { useEffect } from "react"
import { setInGame } from "./updateScheduler"

/**
 * Registers whether a game is active with the update scheduler.
 * Pass true while the user is mid-game; false when idle or complete.
 * Automatically clears the flag on unmount.
 */
export function useGameActive(isActive: boolean): void {
  useEffect(() => {
    setInGame(isActive)
  }, [isActive])

  useEffect(() => {
    return () => setInGame(false)
  }, [])
}
