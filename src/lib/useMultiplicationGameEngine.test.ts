import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useMultiplicationGameEngine } from "./useMultiplicationGameEngine"
import { setInGame } from "./updateScheduler"

vi.mock("./updateScheduler", () => ({
  setInGame: vi.fn(),
  _reset: vi.fn(),
}))

const deps = {
  now: () => 1000,
  generateId: () => "s1",
  random: () => 0.5,
}

beforeEach(() => {
  vi.mocked(setInGame).mockClear()
})

describe("useMultiplicationGameEngine — update scheduler", () => {
  it("marks in-game when start() is called", () => {
    const { result } = renderHook(() => useMultiplicationGameEngine(deps))
    vi.mocked(setInGame).mockClear() // ignore StrictMode mount/unmount calls
    act(() => result.current.start())
    expect(setInGame).toHaveBeenLastCalledWith(true)
  })

  it("marks not in-game when the hook unmounts", () => {
    const { unmount } = renderHook(() => useMultiplicationGameEngine(deps))
    vi.mocked(setInGame).mockClear()
    unmount()
    expect(setInGame).toHaveBeenLastCalledWith(false)
  })
})
