import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import VendorProfileCard from './VendorProfileCard'
import { useCurrentVendor } from '../hooks/useCurrentVendor'

vi.mock('../hooks/useCurrentVendor', () => ({
  useCurrentVendor: vi.fn(),
}))

const mockUseCurrentVendor = vi.mocked(useCurrentVendor)

describe('VendorProfileCard', () => {
  it('renders loading state', () => {
    mockUseCurrentVendor.mockReturnValue({ isLoading: true } as any)
    render(<VendorProfileCard />)
    expect(screen.getByText(/loading vendor/i)).toBeInTheDocument()
  })

  it('renders vendor info', () => {
    mockUseCurrentVendor.mockReturnValue({
      data: {
        id: 1,
        name: 'Vendor X',
        description: 'We sell cards',
        contact_info: JSON.stringify({ email: 'hello@example.com' }),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
      isLoading: false,
      error: null,
    } as any)

    render(<VendorProfileCard />)
    expect(screen.getByText('Vendor X')).toBeInTheDocument()
    expect(screen.getByText(/we sell cards/i)).toBeInTheDocument()
    expect(screen.getByText(/hello@example.com/i)).toBeInTheDocument()
  })
})
