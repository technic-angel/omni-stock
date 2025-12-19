import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import VendorStatsCard from './VendorStatsCard'
import useVendors from '../hooks/useVendors'

vi.mock('../hooks/useVendors', () => ({
  __esModule: true,
  default: vi.fn(),
}))

const mockUseVendors = vi.mocked(useVendors)

describe('VendorStatsCard', () => {
  it('renders loading state', () => {
    mockUseVendors.mockReturnValue({ isLoading: true } as any)
    render(<VendorStatsCard />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseVendors.mockReturnValue({ error: new Error('boom') } as any)
    render(<VendorStatsCard />)
    expect(screen.getByText(/failed to load stats/i)).toBeInTheDocument()
  })

  it('shows totals and active counts', () => {
    mockUseVendors.mockReturnValue({
      data: [
        { id: 1, name: 'A', is_active: true },
        { id: 2, name: 'B', is_active: false },
      ],
      isLoading: false,
      error: null,
    } as any)
    render(<VendorStatsCard />)
    expect(screen.getByText('Total Vendors').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('Active Vendors').nextSibling).toHaveTextContent('1')
  })
})
