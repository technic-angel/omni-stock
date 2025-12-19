import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'

import StoreListCard from './StoreListCard'
import { routerFuture } from '@/app/routes/routerFuture'
import { useVendorStores } from '../hooks/useVendorStores'

vi.mock('../hooks/useVendorStores', () => ({
  useVendorStores: vi.fn(),
}))

const mockUseVendorStores = vi.mocked(useVendorStores)

const renderComponent = () =>
  render(
    <MemoryRouter future={routerFuture}>
      <StoreListCard />
    </MemoryRouter>,
  )

describe('StoreListCard', () => {
  it('shows loading state', () => {
    mockUseVendorStores.mockReturnValue({ isLoading: true } as any)
    renderComponent()
    expect(screen.getByText(/loading stores/i)).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockUseVendorStores.mockReturnValue({ error: new Error('boom') } as any)
    renderComponent()
    expect(screen.getByText(/failed to load stores/i)).toBeInTheDocument()
  })

  it('filters out default store and renders others', () => {
    mockUseVendorStores.mockReturnValue({
      data: [
        { id: 1, name: 'Default Store', type: 'online', is_active: true },
        { id: 2, name: 'Flagship', type: 'retail', is_active: true },
      ],
      isLoading: false,
      error: null,
    } as any)
    renderComponent()
    expect(screen.getByText('Flagship')).toBeInTheDocument()
    expect(screen.queryByText('Default Store')).toBeNull()
    expect(screen.getByRole('link', { name: /manage/i })).toHaveAttribute('href', '/stores/2')
  })

  it('shows empty state when no stores', () => {
    mockUseVendorStores.mockReturnValue({ data: [], isLoading: false, error: null } as any)
    renderComponent()
    expect(screen.getByText(/no stores yet/i)).toBeInTheDocument()
  })
})
