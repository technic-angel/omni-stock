import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'

import StoreDetailPage from './StoreDetailPage'
import { routerFuture } from '@/app/routes/routerFuture'
import { useVendorStores } from '../hooks/useVendorStores'

vi.mock('../hooks/useVendorStores', () => ({
  useVendorStores: vi.fn(),
}))

const mockUseVendorStores = vi.mocked(useVendorStores)

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ storeId: '2' }),
  }
})

const renderPage = () =>
  render(
    <MemoryRouter future={routerFuture}>
      <StoreDetailPage />
    </MemoryRouter>,
  )

describe('StoreDetailPage', () => {
  it('renders store details when found', () => {
    mockUseVendorStores.mockReturnValue({
      data: [{ id: 2, name: 'Flagship', is_active: true, type: 'retail', created_at: '2024-01-01', updated_at: '2024-02-02' }],
      isLoading: false,
      error: null,
    } as any)
    renderPage()
    expect(screen.getByText(/Flagship/)).toBeVisible()
    expect(
      screen.getByText((content) => content.includes('Active') && content.toLowerCase().includes('retail')),
    ).toBeVisible()
  })

  it('shows fallback when store missing', () => {
    mockUseVendorStores.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any)
    renderPage()
    expect(screen.getByText(/Store not found/i)).toBeVisible()
  })

  it('shows loading state', () => {
    mockUseVendorStores.mockReturnValue({ isLoading: true } as any)
    renderPage()
    expect(screen.getByText(/Loading store details/i)).toBeVisible()
  })
})
