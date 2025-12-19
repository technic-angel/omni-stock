import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useInviteVendorMember } from './useInviteVendorMember'
import * as api from '../api/vendorsApi'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper, queryClient }
}

describe('useInviteVendorMember', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls API and invalidates members cache', async () => {
    const payload = { email: 'member@example.com' }
    const apiSpy = vi.spyOn(api, 'inviteVendorMember').mockResolvedValue({ id: 1 } as any)
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useInviteVendorMember(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(payload as any)
    })

    expect(apiSpy).toHaveBeenCalledWith(payload)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vendor-members'] })
  })
})
