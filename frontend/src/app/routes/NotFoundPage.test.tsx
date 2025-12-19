import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import NotFoundPage from './NotFoundPage'

describe('NotFoundPage', () => {
  it('shows a friendly message and link back to inventory', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /go back to inventory/i })
    expect(link).toHaveAttribute('href', '/inventory')
  })
})
