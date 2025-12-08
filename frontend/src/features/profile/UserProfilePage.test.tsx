import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { UserProfilePage } from './UserProfilePage'
import { useCurrentUser } from '../auth/hooks/useCurrentUser'
import { useUpdateProfile } from '@/features/auth/hooks/useUpdateProfile'

vi.mock('../auth/hooks/useCurrentUser')
vi.mock('@/features/auth/hooks/useUpdateProfile')

const mockUseCurrentUser = vi.mocked(useCurrentUser)
const mockUseUpdateProfile = vi.mocked(useUpdateProfile)

const baseUser = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  first_name: 'Admin',
  last_name: 'User',
  full_name: 'Admin User',
  role: 'solo',
  profile_completed: true,
  company_name: 'Omni Corp',
  company_code: null,
  company_site: null,
  phone_number: '555-0000',
  birthdate: '1990-01-01',
  profile: {
    id: 1,
    phone: '555-0000',
    bio: 'Existing bio',
    profile_picture: null,
  },
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <UserProfilePage />
    </MemoryRouter>,
  )

describe('UserProfilePage', () => {
  let mutateAsync: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mutateAsync = vi.fn().mockResolvedValue(baseUser)
    mockUseCurrentUser.mockReturnValue({ data: baseUser, isLoading: false })
    mockUseUpdateProfile.mockReturnValue({ mutateAsync, isPending: false, error: null })
  })

  it('renders the disabled profile picture upload input', () => {
    renderPage()

    expect(screen.getByLabelText(/Profile picture upload/)).toBeDisabled()
  })

  it('submits the edited profile fields through the update hook', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Edit Profile/i }))
    await user.clear(screen.getByLabelText(/First name/i))
    await user.type(screen.getByLabelText(/First name/i), 'Melissa')
    await user.clear(screen.getByLabelText(/Last name/i))
    await user.type(screen.getByLabelText(/Last name/i), 'Berumen')
    await user.clear(screen.getByLabelText(/Phone number/i))
    await user.type(screen.getByLabelText(/Phone number/i), '555-5555')
    await user.clear(screen.getByLabelText(/Company/i))
    await user.type(screen.getByLabelText(/Company/i), 'Omni Stock')
    await user.clear(screen.getByLabelText(/Short bio/i))
    await user.type(screen.getByLabelText(/Short bio/i), 'Building Omni Stock')

    await user.click(screen.getByRole('button', { name: /Save Profile/i }))

    expect(mutateAsync).toHaveBeenCalledWith({
      username: 'admin',
      first_name: 'Melissa',
      last_name: 'Berumen',
      phone_number: '555-5555',
      company_name: 'Omni Stock',
      birthdate: '1990-01-01',
      bio: 'Building Omni Stock',
      phone: '555-5555',
    })
  })
})
