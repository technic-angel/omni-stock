import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useCurrentUser } from './useCurrentUser'
import { getCurrentUser } from '../api/authApi'
import { useAppDispatch } from '@/store/hooks'
import { clearCredentials, setProfileComplete } from '@/store/slices/authSlice'
import { useQuery } from '@tanstack/react-query'

vi.mock('../api/authApi', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/store/hooks', () => ({
  useAppDispatch: vi.fn(),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  )
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

const mockUseQuery = vi.mocked(useQuery)

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dispatches profile completion status on success', async () => {
    const dispatchMock = vi.fn()
    vi.mocked(useAppDispatch).mockReturnValue(dispatchMock)

    const user = {
      id: 1,
      username: 'melissa',
      email: 'melissa@example.com',
      role: 'solo',
      profile_completed: true,
    }

    vi.mocked(getCurrentUser).mockResolvedValue(user as any)

    mockUseQuery.mockImplementation((options: any) => {
      return { data: user, isError: false }
    })

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.data).toEqual(user)
    expect(dispatchMock).toHaveBeenCalledWith(setProfileComplete(true))
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['currentUser'], queryFn: expect.any(Function) }),
    )
    const queryFn = mockUseQuery.mock.calls[0][0].queryFn
    await expect(queryFn()).resolves.toEqual(user)
  })

  it('clears credentials when API responds with 401', () => {
    const dispatchMock = vi.fn()
    vi.mocked(useAppDispatch).mockReturnValue(dispatchMock)

    const error = {
      response: { status: 401 },
      message: 'unauthorized'
    }

    mockUseQuery.mockImplementation((options: any) => {
      return { data: undefined, isError: true, error }
    })

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.isError).toBe(true)
    expect(dispatchMock).toHaveBeenCalledWith(clearCredentials())
    expect(mockUseQuery).toHaveBeenCalled()
  })
})
