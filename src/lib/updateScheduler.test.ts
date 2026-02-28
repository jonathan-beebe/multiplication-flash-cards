import { describe, it, expect, vi, beforeEach } from "vitest"
import { setInGame, scheduleUpdate, _reset } from "./updateScheduler"

beforeEach(() => {
  _reset()
})

describe("scheduleUpdate", () => {
  it("fires immediately when not in game", () => {
    const fn = vi.fn()
    scheduleUpdate(fn)
    expect(fn).toHaveBeenCalledOnce()
  })

  it("queues the update when in game", () => {
    setInGame(true)
    const fn = vi.fn()
    scheduleUpdate(fn)
    expect(fn).not.toHaveBeenCalled()
  })

  it("fires the queued update when the game ends", () => {
    setInGame(true)
    const fn = vi.fn()
    scheduleUpdate(fn)
    setInGame(false)
    expect(fn).toHaveBeenCalledOnce()
  })

  it("replaces a pending update if a newer one is scheduled", () => {
    setInGame(true)
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    scheduleUpdate(fn1)
    scheduleUpdate(fn2)
    setInGame(false)
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalledOnce()
  })
})

describe("setInGame", () => {
  it("is a no-op when set to false with no pending update", () => {
    expect(() => setInGame(false)).not.toThrow()
  })

  it("does not fire the pending update while still in game", () => {
    setInGame(true)
    const fn = vi.fn()
    scheduleUpdate(fn)
    setInGame(true) // still in game
    expect(fn).not.toHaveBeenCalled()
  })

  it("clears the pending update after firing it", () => {
    setInGame(true)
    const fn = vi.fn()
    scheduleUpdate(fn)
    setInGame(false) // fires fn
    setInGame(false) // second call should not fire fn again
    expect(fn).toHaveBeenCalledOnce()
  })
})
