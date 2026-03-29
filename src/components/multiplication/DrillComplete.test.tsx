import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DrillCompleteContent } from './DrillComplete'

describe('DrillCompleteContent', () => {
  it('renders with prop-based counts', () => {
    render(
      <MemoryRouter>
        <DrillCompleteContent correctCount={42} wrongCount={8} />
      </MemoryRouter>,
    )

    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument() // 42 + 8 attempted
  })
})
