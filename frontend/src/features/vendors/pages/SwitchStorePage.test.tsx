import { beforeEach, describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import SwitchStorePage from './SwitchStorePage'
import { routerFuture } from '@/app/routes/routerFuture'
import { useVendorStores } from '../hooks/useVendorStores'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useSelectStore } from '../hooks/useSelectStore'

vi.mock('../hooks/useVendorStores', () => ({
  useVendorStores: vi.fn(),
}))

vi.mock('@/features/auth/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}))

vi.mock('../hooks/useSelectStore', () => ({
  useSelectStore: vi.fn(),
}))

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

const renderPage = () =>
  render(
    <MemoryRouter future={routerFuture}>
      <SwitchStorePage />
    </MemoryRouter>,
  )

const mockUseVendorStores = vi.mocked(useVendorStores)
const mockUseCurrentUser = vi.mocked(useCurrentUser)
const mockUseSelectStore = vi.mocked(useSelectStore)

describe('SwitchStorePage', () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReturnValue({ data: { active_store: { id: 2 } }, isLoading: false } as any)
    mockUseSelectStore.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
  })

  it('renders list of stores and selects a new one', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    mockUseVendorStores.mockReturnValue({
      data: [
        { id: 1, name: 'Default Store', type: 'online', is_active: true },
        { id: 2, name: 'Flagship', type: 'retail', is_active: true },
        { id: 3, name: 'Warehouse', type: 'warehouse', is_active: false },
      ],
      isLoading: false,
      error: null,
    } as any)
    mockUseSelectStore.mockReturnValue({ mutateAsync, isPending: false } as any)

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /set as active/i }))
    expect(mutateAsync).toHaveBeenCalledWith(3)
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/stores/3'))
  })

  it('shows loading state', () => {
    mockUseVendorStores.mockReturnValue({ isLoading: true } as any)
    renderPage()
    expect(screen.getByText(/Loading stores…/i)).toBeVisible()
  })

  it('shows empty state', () => {
    mockUseVendorStores.mockReturnValue({ data: [], isLoading: false, error: null } as any)
    renderPage()
    expect(screen.getByText(/No stores yet/i)).toBeVisible()
  })
})
