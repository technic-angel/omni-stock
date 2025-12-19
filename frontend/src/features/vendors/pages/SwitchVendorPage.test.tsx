import { beforeEach, describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import SwitchVendorPage from './SwitchVendorPage'
import { routerFuture } from '@/app/routes/routerFuture'
import { useVendors } from '../hooks/useVendors'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useSelectVendor } from '../hooks/useSelectVendor'

vi.mock('../hooks/useVendors', () => ({
  useVendors: vi.fn(),
}))

vi.mock('@/features/auth/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}))

vi.mock('../hooks/useSelectVendor', () => ({
  useSelectVendor: vi.fn(),
}))

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

const mockUseVendors = vi.mocked(useVendors)
const mockUseCurrentUser = vi.mocked(useCurrentUser)
const mockUseSelectVendor = vi.mocked(useSelectVendor)

const renderPage = () =>
  render(
    <MemoryRouter future={routerFuture}>
      <SwitchVendorPage />
    </MemoryRouter>,
  )

describe('SwitchVendorPage', () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReturnValue({ data: { active_vendor: { id: 1 } }, isLoading: false } as any)
    mockUseSelectVendor.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
  })

  it('lists vendors and sets a new active vendor', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    mockUseVendors.mockReturnValue({
      data: [
        { id: 1, name: 'Alpha', description: 'A', is_active: true },
        { id: 2, name: 'Beta', description: 'B', is_active: true },
      ],
      isLoading: false,
      error: null,
    } as any)
    mockUseSelectVendor.mockReturnValue({ mutateAsync, isPending: false } as any)

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /set as active/i }))
    expect(mutateAsync).toHaveBeenCalledWith(2)
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/vendors'))
  })

  it('shows empty prompt when no vendors', () => {
    mockUseVendors.mockReturnValue({ data: [], isLoading: false, error: null } as any)
    renderPage()
    expect(screen.getByText(/You are not linked/i)).toBeVisible()
  })
})
