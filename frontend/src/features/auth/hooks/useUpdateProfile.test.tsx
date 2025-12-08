import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useUpdateProfile } from './useUpdateProfile'
import * as authApi from '../api/authApi'

vi.mock('../api/authApi', () => ({
  updateProfile: vi.fn(),
}))

describe('useUpdateProfile', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  it('calls the API and invalidates the current user cache on success', async () => {
    const payload = {
      username: 'melissa',
      first_name: 'Melissa',
      last_name: 'Berumen',
      company_name: 'Omni',
      phone_number: '555-1234',
      bio: 'hi',
    }
    vi.mocked(authApi.updateProfile).mockResolvedValue({ id: 1, username: 'melissa' } as any)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    await result.current.mutateAsync(payload)

    expect(authApi.updateProfile).toHaveBeenCalledWith(payload)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['currentUser'] })
    })
  })
})
