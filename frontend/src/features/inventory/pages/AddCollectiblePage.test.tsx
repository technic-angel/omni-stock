import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import AddCollectiblePage from './AddCollectiblePage'
import { routerFuture } from '@/app/routes/routerFuture'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('AddCollectiblePage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter future={routerFuture}>
        <AddCollectiblePage />
      </MemoryRouter>,
    )

  it('renders default Pokemon fields and price insights', () => {
    renderPage()
    expect(screen.getByText(/Add New Item/i)).toBeVisible()
    expect(screen.getByText(/Market Insights/i)).toBeVisible()
    expect(screen.getByLabelText(/Category/i)).toBeVisible()
    expect(screen.getByLabelText(/Item Name/i)).toBeVisible()
    expect(screen.getByText(/Set Name/i)).toBeVisible()
  })

  it('switches category specific fields and supports cancel navigation', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'clothing' } })
    expect(screen.getByLabelText(/Size/i)).toBeVisible()
    expect(screen.getByLabelText(/Brand/i)).toBeVisible()

    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'other' } })
    expect(screen.getByText(/No additional fields for this category/i)).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(navigate).toHaveBeenCalledWith('/inventory')
  })
})
