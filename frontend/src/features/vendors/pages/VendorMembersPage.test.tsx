import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import VendorMembersPage from './VendorMembersPage'
import { routerFuture } from '@/app/routes/routerFuture'
import { useInviteVendorMember } from '../hooks/useInviteVendorMember'

vi.mock('../hooks/useInviteVendorMember', () => ({
  useInviteVendorMember: vi.fn(),
}))

vi.mock('../components/VendorMembersCard', () => ({
  __esModule: true,
  default: () => <div>Members Table</div>,
}))

const mockUseInviteVendorMember = vi.mocked(useInviteVendorMember)

describe('VendorMembersPage', () => {
  it('invites a member', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    mockUseInviteVendorMember.mockReturnValue({ mutateAsync, isPending: false } as any)
    render(
      <MemoryRouter future={routerFuture}>
        <VendorMembersPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText(/teammate/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByDisplayValue('manager'), { target: { value: 'admin' } })
    fireEvent.click(screen.getByRole('button', { name: /invite/i }))

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ email: 'user@example.com', role: 'admin' }),
    )
  })
})
