import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

afterEach(() => {
  cleanup()
})

const originalConsoleError = console.error
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    originalConsoleError(...args)
    throw new Error(
      `console.error called during test: ${args
        .map((a) => (a instanceof Error ? a.message : typeof a === 'string' ? a : JSON.stringify(a)))
        .join(' ')}`,
    )
  }
})
afterEach(() => {
  console.error = originalConsoleError
})

const QUIET_METHODS = ['log', 'info', 'warn', 'debug'] as const
type QuietMethod = (typeof QUIET_METHODS)[number]
const originalQuiet = {} as Record<QuietMethod, (...args: unknown[]) => void>
let consoleBuffer: Array<{ method: QuietMethod; args: unknown[] }> = []

beforeEach(() => {
  consoleBuffer = []
  for (const method of QUIET_METHODS) {
    originalQuiet[method] = console[method]
    console[method] = (...args: unknown[]) => {
      consoleBuffer.push({ method, args })
    }
  }
})
afterEach((ctx) => {
  for (const method of QUIET_METHODS) {
    console[method] = originalQuiet[method]
  }
  if (ctx.task.result?.state === 'fail') {
    for (const { method, args } of consoleBuffer) {
      originalQuiet[method](...args)
    }
  }
  consoleBuffer = []
})
