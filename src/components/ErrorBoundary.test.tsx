import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('navigates Go home to the configured BASE_URL, not the site root', async () => {
    vi.stubEnv('BASE_URL', '/multiplication-flash-cards/')
    const assign = vi.fn()
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, assign },
      configurable: true,
      writable: true,
    })

    const { ErrorFallback } = await import('@/components/ErrorBoundary')
    render(<ErrorFallback />)
    await userEvent.click(screen.getByRole('button', { name: 'Go home' }))

    expect(assign).toHaveBeenCalledWith('/multiplication-flash-cards/')

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
      writable: true,
    })
    vi.unstubAllEnvs()
  })
})
