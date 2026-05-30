import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  it('logs caught render errors with a tag, the error, and a component stack', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    const tagged = errorSpy.mock.calls.find((args) => args[0] === '[ErrorBoundary]')
    expect(tagged, 'expected console.error to be called with "[ErrorBoundary]" tag').toBeDefined()
    expect(tagged?.[1]).toBeInstanceOf(Error)
    expect((tagged?.[1] as Error).message).toBe('boom')
    expect(typeof tagged?.[2]).toBe('string')
    expect(tagged?.[2] as string).toContain('Boom')
  })
})
