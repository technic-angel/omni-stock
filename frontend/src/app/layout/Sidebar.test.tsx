import type { ReactElement } from 'react'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, useLocation } from 'react-router-dom'

import { Sidebar, MobileSidebarTrigger } from './Sidebar'
import { routerFuture } from '../routes/routerFuture'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useVendorInvites } from '@/features/vendors/hooks/useVendorInvites'
import { useAcceptVendorInvite } from '@/features/vendors/hooks/useAcceptVendorInvite'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

vi.mock('@/shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(),
}))

vi.mock('@/shared/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useLocation: vi.fn(),
  }
})

vi.mock('@/features/auth/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}))

vi.mock('@/features/vendors/hooks/useVendorInvites', () => ({
  useVendorInvites: vi.fn(),
}))

vi.mock('@/features/vendors/hooks/useAcceptVendorInvite', () => ({
  useAcceptVendorInvite: vi.fn(),
}))

const mockUseLocalStorage = vi.mocked(useLocalStorage)
const mockUseMediaQuery = vi.mocked(useMediaQuery)
const mockUseLocation = useLocation as unknown as vi.Mock
const mockUseCurrentUser = vi.mocked(useCurrentUser)
const mockUseVendorInvites = vi.mocked(useVendorInvites)
const mockUseAcceptVendorInvite = vi.mocked(useAcceptVendorInvite)

const renderSidebar = (ui: ReactElement = <Sidebar />) =>
  render(<BrowserRouter future={routerFuture}>{ui}</BrowserRouter>)

const baseUser = {
  id: 1,
  username: 'john',
  email: 'john@example.com',
  full_name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe',
  profile_completed: true,
  active_vendor: { id: 10, name: 'Mellycorp' },
  active_store: { id: 20, name: 'Flagship' },
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocalStorage.mockReturnValue([true, vi.fn()])
    mockUseMediaQuery.mockReturnValue(false)
    mockUseLocation.mockReturnValue({
      pathname: '/dashboard',
      search: '',
      hash: '',
      state: null,
      key: 'test',
    })
    mockUseCurrentUser.mockReturnValue({ data: baseUser, isLoading: false } as any)
    mockUseVendorInvites.mockReturnValue({ data: [] } as any)
    mockUseAcceptVendorInvite.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
  })

  it('renders vendor and store cards when context available', () => {
    renderSidebar()
    expect(screen.getByText('Mellycorp')).toBeVisible()
    expect(screen.getByText('Flagship')).toBeVisible()
    expect(screen.getByText('Vendor Settings')).toBeVisible()
    expect(screen.getByText('Members & Roles')).toBeVisible()
  })

  it('highlights vendor settings only on /vendors', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/vendors',
      search: '',
      hash: '',
      state: null,
      key: 'vendors',
    })
    renderSidebar()
    const vendorSettingsLink = screen.getByRole('link', { name: /vendor settings/i })
    const membersLink = screen.getByRole('link', { name: /members & roles/i })
    expect(vendorSettingsLink.className).toContain('bg-brand-primary')
    expect(membersLink.className).not.toContain('bg-brand-primary')
  })

  it('highlights members route without affecting vendor settings', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/vendors/members',
      search: '',
      hash: '',
      state: null,
      key: 'members',
    })
    renderSidebar()
    const vendorSettingsLink = screen.getByRole('link', { name: /vendor settings/i })
    const membersLink = screen.getByRole('link', { name: /members & roles/i })
    expect(membersLink.className).toContain('bg-brand-primary')
    expect(vendorSettingsLink.className).not.toContain('bg-brand-primary')
  })

  it('hides quick access section when no shortcuts are configured', () => {
    renderSidebar()
    expect(screen.queryByText(/quick access/i)).toBeNull()
  })

  it('collapses text when stored value is false', () => {
    mockUseLocalStorage.mockReturnValue([false, vi.fn()])
    renderSidebar()
    expect(screen.queryByText('Vendor Settings')).toBeNull()
    expect(screen.getAllByAltText('Omni-Stock')[0]).toBeVisible()
  })

  it('shows no-vendor prompt when user has no vendor', () => {
    mockUseCurrentUser.mockReturnValue({ data: { ...baseUser, active_vendor: null, active_store: null }, isLoading: false } as any)
    renderSidebar()
    expect(screen.getByText(/No vendor yet/i)).toBeVisible()
    expect(screen.getByText(/Create Your First Vendor/i)).toHaveAttribute('href', '/vendors/new')
  })

  it('shows store creation call-to-action when vendor lacks store', () => {
    mockUseCurrentUser.mockReturnValue({
      data: { ...baseUser, active_store: null },
      isLoading: false,
    } as any)
    renderSidebar()
    expect(screen.getByText(/Store: None yet/i)).toBeVisible()
    expect(screen.getByRole('link', { name: /Create First Store/i })).toHaveAttribute('href', '/stores/new')
  })

  it('renders search input only when store exists', () => {
    const firstRender = renderSidebar()
    expect(screen.getByPlaceholderText(/search inventory, stores/i)).toBeVisible()
    firstRender.unmount()
    mockUseCurrentUser.mockReturnValue({ data: { ...baseUser, active_store: null }, isLoading: false } as any)
    renderSidebar()
    expect(screen.queryByPlaceholderText(/search inventory, stores/i)).toBeNull()
  })

  it('renders mobile sheet when viewport is mobile', () => {
    mockUseMediaQuery.mockReturnValue(true)
    renderSidebar(<MobileSidebarTrigger />)
    expect(screen.getByRole('button', { name: /open sidebar/i })).toBeVisible()
  })
})
