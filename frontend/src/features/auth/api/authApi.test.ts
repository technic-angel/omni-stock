import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  register,
  checkEmailAvailability,
  login,
  refreshToken,
  getCurrentUser,
  completeProfile,
  logout,
} from './authApi'
import { http } from '../../../shared/lib/http'
import { tokenStore } from '../../../shared/lib/tokenStore'

vi.mock('../../../shared/lib/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../../../shared/lib/tokenStore', () => ({
  tokenStore: {
    setTokens: vi.fn(),
    setAccess: vi.fn(),
    getRefresh: vi.fn(),
    clear: vi.fn(),
  },
}))

const mockGet = vi.mocked(http.get)
const mockPost = vi.mocked(http.post)
const mockTokenStore = vi.mocked(tokenStore)

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers a user with trimmed company name', async () => {
    mockPost.mockResolvedValue({ data: { id: 1, username: 'melissa' } })

    const response = await register(
      'melissa',
      'melissa@example.com',
      'Melissa',
      'Berumen',
      'pass',
      '1990-01-01',
      '  Omni  ',
    )

    expect(mockPost).toHaveBeenCalledWith('/auth/register/', {
      username: 'melissa',
      email: 'melissa@example.com',
      first_name: 'Melissa',
      last_name: 'Berumen',
      password: 'pass',
      birthdate: '1990-01-01',
      company_name: 'Omni',
    })
    expect(response).toEqual({ id: 1, username: 'melissa' })
  })

  it('checks email availability', async () => {
    mockPost.mockResolvedValue({ data: { available: true } })
    const data = await checkEmailAvailability('test@example.com')
    expect(mockPost).toHaveBeenCalledWith('/auth/register/check-email/', {
      email: 'test@example.com',
    })
    expect(data).toEqual({ available: true })
  })

  it('logs in and sets tokens', async () => {
    mockPost.mockResolvedValue({ data: { access: 'a', refresh: 'b' } })
    const data = await login('user', 'pass')
    expect(mockPost).toHaveBeenCalledWith('/auth/token/', { username: 'user', password: 'pass' })
    expect(mockTokenStore.setTokens).toHaveBeenCalledWith('a', 'b')
    expect(data).toEqual({ access: 'a', refresh: 'b' })
  })

  it('refreshes token when refresh token exists', async () => {
    mockTokenStore.getRefresh.mockReturnValue('refresh-token')
    mockPost.mockResolvedValue({ data: { access: 'new-access' } })

    const result = await refreshToken()

    expect(mockPost).toHaveBeenCalledWith('/auth/token/refresh/', { refresh: 'refresh-token' })
    expect(mockTokenStore.setAccess).toHaveBeenCalledWith('new-access')
    expect(result).toBe('new-access')
  })

  it('throws when refresh token is missing', async () => {
    mockTokenStore.getRefresh.mockReturnValue(null)
    await expect(refreshToken()).rejects.toThrow('No refresh token available')
  })

  it('fetches the current user', async () => {
    mockGet.mockResolvedValue({ data: { id: 1 } })
    const data = await getCurrentUser()
    expect(mockGet).toHaveBeenCalledWith('/auth/me/')
    expect(data).toEqual({ id: 1 })
  })

  it('completes profile', async () => {
    mockPost.mockResolvedValue({ data: { id: 1 } })
    const payload = { username: 'melissa', password: 'pass' }
    const data = await completeProfile(payload as any)
    expect(mockPost).toHaveBeenCalledWith('/auth/profile/complete/', payload)
    expect(data).toEqual({ id: 1 })
  })

  it('clears tokens on logout even if request fails', async () => {
    mockTokenStore.getRefresh.mockReturnValue('refresh')
    mockPost.mockRejectedValue(new Error('network'))

    await logout()

    expect(mockTokenStore.clear).toHaveBeenCalled()
  })

  it('clears tokens immediately when there is no refresh token', async () => {
    mockTokenStore.getRefresh.mockReturnValue(null)

    await logout()

    expect(mockTokenStore.clear).toHaveBeenCalled()
    expect(mockPost).not.toHaveBeenCalled()
  })
})
