import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import VendorMembersCard from './VendorMembersCard'
import { useVendorMembers } from '../hooks/useVendorMembers'
import { useUpdateVendorMember } from '../hooks/useUpdateVendorMember'

vi.mock('../hooks/useVendorMembers', () => ({
  useVendorMembers: vi.fn(),
}))

vi.mock('../hooks/useUpdateVendorMember', () => ({
  useUpdateVendorMember: vi.fn(),
}))

const mockUseVendorMembers = vi.mocked(useVendorMembers)
const mockUseUpdateVendorMember = vi.mocked(useUpdateVendorMember)

describe('VendorMembersCard', () => {
  beforeEach(() => {
    mockUseUpdateVendorMember.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
  })

  it('renders loading state', () => {
    mockUseVendorMembers.mockReturnValue({ isLoading: true } as any)
    render(<VendorMembersCard />)
    expect(screen.getByText(/loading members/i)).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseVendorMembers.mockReturnValue({ error: new Error('boom') } as any)
    render(<VendorMembersCard />)
    expect(screen.getByText(/failed to load members/i)).toBeInTheDocument()
  })

  it('renders rows and triggers role change', () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    mockUseVendorMembers.mockReturnValue({
      data: [{ id: 1, email: 'a@example.com', role: 'member', is_active: true }],
      isLoading: false,
      error: null,
    } as any)
    mockUseUpdateVendorMember.mockReturnValue({ mutateAsync, isPending: false } as any)

    render(<VendorMembersCard />)
    fireEvent.change(screen.getByDisplayValue('member'), { target: { value: 'admin' } })
    expect(mutateAsync).toHaveBeenCalledWith({ id: 1, payload: { role: 'admin' } })
  })

  it('deactivates member on remove click', () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    mockUseVendorMembers.mockReturnValue({
      data: [{ id: 2, email: 'b@example.com', role: 'admin', is_active: true }],
      isLoading: false,
      error: null,
    } as any)
    mockUseUpdateVendorMember.mockReturnValue({ mutateAsync, isPending: false } as any)

    render(<VendorMembersCard />)
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(mutateAsync).toHaveBeenCalledWith({ id: 2, payload: { is_active: false } })
  })
})
