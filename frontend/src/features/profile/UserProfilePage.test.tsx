import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { UserProfilePage } from './UserProfilePage'
import { useCurrentUser } from '../auth/hooks/useCurrentUser'
import { useUpdateProfile } from '@/features/auth/hooks/useUpdateProfile'
import { uploadImageToSupabase, validateImageFile, isSupabaseConfigured } from '@/shared/lib/supabase'

vi.mock('../auth/hooks/useCurrentUser')
vi.mock('@/features/auth/hooks/useUpdateProfile')
vi.mock('@/shared/lib/supabase', () => ({
  uploadImageToSupabase: vi.fn(),
  validateImageFile: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
  SUPABASE_BUCKET: 'profile-avatars',
}))

const mockUseCurrentUser = vi.mocked(useCurrentUser)
const mockUseUpdateProfile = vi.mocked(useUpdateProfile)
const mockUploadImageToSupabase = vi.mocked(uploadImageToSupabase)
const mockValidateImageFile = vi.mocked(validateImageFile)
const mockIsSupabaseConfigured = vi.mocked(isSupabaseConfigured)

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
  const originalCreateImageBitmap = globalThis.createImageBitmap

  beforeEach(() => {
    mutateAsync = vi.fn().mockResolvedValue(baseUser)
    mockUseCurrentUser.mockReturnValue({ data: baseUser, isLoading: false })
    mockUseUpdateProfile.mockReturnValue({ mutateAsync, isPending: false, error: null })
    mockUploadImageToSupabase.mockReset()
    mockValidateImageFile.mockReset()
    mockIsSupabaseConfigured.mockReturnValue(true)
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 512, height: 512 })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalCreateImageBitmap) {
      globalThis.createImageBitmap = originalCreateImageBitmap
    } else {
      delete (globalThis as any).createImageBitmap
    }
  })

  it('renders the disabled profile picture upload input', () => {
    renderPage()

    expect(screen.getByLabelText(/Profile picture upload/)).toBeDisabled()
  })

  it('shows a loading indicator when user data is loading', () => {
    mockUseCurrentUser.mockReturnValueOnce({ data: undefined, isLoading: true })
    renderPage()
    expect(screen.getByText(/Loading user data/i)).toBeInTheDocument()
  })

  it('submits the edited profile fields through the update hook', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Edit Profile/i }))
    await user.clear(screen.getByLabelText(/Role/i))
    await user.type(screen.getByLabelText(/Role/i), 'Founder')
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
      profile_picture_url: null,
      avatar: null,
      delete_profile_picture: undefined,
    })
  })

  it('confirms before removing an existing profile photo', async () => {
    const userWithPhoto = {
      ...baseUser,
      profile: { ...baseUser.profile, profile_picture: 'https://existing/photo.png' },
    }
    mockUseCurrentUser.mockReturnValue({ data: userWithPhoto, isLoading: false })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()

    renderPage()
    await user.click(screen.getByRole('button', { name: /Edit Profile/i }))
    await user.click(screen.getByRole('button', { name: /Remove photo/i }))
    await user.click(screen.getByRole('button', { name: /Save Profile/i }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        delete_profile_picture: true,
        profile_picture_url: null,
        avatar: null,
      }),
    )
    confirmSpy.mockRestore()
  })

  it('ignores avatar upload input when no file is provided', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /Edit Profile/i }))

    const fileInput = screen.getByLabelText(/Profile picture upload/i)
    fireEvent.change(fileInput, { target: { files: [] } })

    expect(mockUploadImageToSupabase).not.toHaveBeenCalled()
  })

  it('uploads an avatar via Supabase and displays metadata summary', async () => {
    const user = userEvent.setup()
    mockUploadImageToSupabase.mockResolvedValue('https://supabase/avatar.png')

    renderPage()
    await user.click(screen.getByRole('button', { name: /Edit Profile/i }))

    const fileInput = screen.getByLabelText(/Profile picture upload/i)
    const file = new File([new Uint8Array(128 * 1024)], 'avatar.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(mockValidateImageFile).toHaveBeenCalledWith(file)
    expect(mockUploadImageToSupabase).toHaveBeenCalledWith(file, 'profile-avatars/1')

    expect(await screen.findByText(/Upload ready/i)).toBeInTheDocument()
    expect(screen.getByText(/Metadata:/)).toHaveTextContent('Metadata: 512×512 px · 128 KB')

    await user.click(screen.getByRole('button', { name: /Save Profile/i }))
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_picture_url: 'https://supabase/avatar.png',
        avatar: expect.objectContaining({
          url: 'https://supabase/avatar.png',
          width: 512,
          height: 512,
          size_kb: 128,
        }),
      }),
    )
  })

  it('handles Supabase misconfiguration errors', async () => {
    const user = userEvent.setup()
    mockIsSupabaseConfigured.mockReturnValue(false)
    renderPage()
    await user.click(screen.getByRole('button', { name: /Edit Profile/i }))

    const fileInput = screen.getByLabelText(/Profile picture upload/i)
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByText(/Supabase environment variables are missing/i)).toBeInTheDocument()
    expect(mockUploadImageToSupabase).not.toHaveBeenCalled()
  })

  it('surfaces file validation errors from Supabase uploads', async () => {
    const user = userEvent.setup()
    mockValidateImageFile.mockImplementation(() => {
      throw new Error('File is too large')
    })
    renderPage()
    await user.click(screen.getByRole('button', { name: /Edit Profile/i }))

    const fileInput = screen.getByLabelText(/Profile picture upload/i)
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByText(/File is too large/i)).toBeInTheDocument()
    expect(mockUploadImageToSupabase).not.toHaveBeenCalled()
  })

  it('keeps the avatar when delete is canceled', async () => {
    const userWithPhoto = {
      ...baseUser,
      profile: { ...baseUser.profile, profile_picture: 'https://existing/photo.png' },
    }
    mockUseCurrentUser.mockReturnValue({ data: userWithPhoto, isLoading: false })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()

    renderPage()
    await user.click(screen.getByRole('button', { name: /Edit Profile/i }))
    await user.click(screen.getByRole('button', { name: /Remove photo/i }))
    await user.click(screen.getByRole('button', { name: /Save Profile/i }))

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_picture_url: 'https://existing/photo.png',
        delete_profile_picture: undefined,
      }),
    )
    confirmSpy.mockRestore()
  })

  it('resets an in-progress avatar upload when canceling edits', async () => {
    mockUploadImageToSupabase.mockResolvedValue('https://supabase/new-avatar.png')
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /Edit Profile/i }))

    const file = new File([new Uint8Array(64 * 1024)], 'avatar.png', { type: 'image/png' })
    const fileInput = screen.getByLabelText(/Profile picture upload/i)
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(await screen.findByText(/Upload ready/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Cancel edit/i }))
    await user.click(screen.getByRole('button', { name: /Edit Profile/i }))
    await user.click(screen.getByRole('button', { name: /Save Profile/i }))

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_picture_url: null,
        avatar: null,
      }),
    )
  })
})
