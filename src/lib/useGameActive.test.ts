import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useGameActive } from "./useGameActive"
import { setInGame } from "./updateScheduler"

vi.mock("./updateScheduler", () => ({
  setInGame: vi.fn(),
  _reset: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(setInGame).mockClear()
})

describe("useGameActive", () => {
  it("calls setInGame(true) on mount when isActive is true", () => {
    renderHook(() => useGameActive(true))
    expect(setInGame).toHaveBeenCalledWith(true)
  })

  it("calls setInGame(false) on mount when isActive is false", () => {
    renderHook(() => useGameActive(false))
    expect(setInGame).toHaveBeenCalledWith(false)
  })

  it("calls setInGame again when isActive changes", () => {
    let active = false
    const { rerender } = renderHook(() => useGameActive(active))
    vi.mocked(setInGame).mockClear()

    active = true
    rerender()
    expect(setInGame).toHaveBeenCalledWith(true)

    active = false
    rerender()
    expect(setInGame).toHaveBeenCalledWith(false)
  })

  it("calls setInGame(false) on unmount regardless of isActive", () => {
    const { unmount } = renderHook(() => useGameActive(true))
    vi.mocked(setInGame).mockClear()
    unmount()
    expect(setInGame).toHaveBeenLastCalledWith(false)
  })

  it("calls setInGame(false) on unmount when isActive was false", () => {
    const { unmount } = renderHook(() => useGameActive(false))
    vi.mocked(setInGame).mockClear()
    unmount()
    expect(setInGame).toHaveBeenLastCalledWith(false)
  })
})
