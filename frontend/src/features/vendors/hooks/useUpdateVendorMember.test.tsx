import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useUpdateVendorMember } from './useUpdateVendorMember'
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

describe('useUpdateVendorMember', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('updates members and invalidates cache', async () => {
    const apiSpy = vi.spyOn(api, 'updateVendorMember').mockResolvedValue({ id: 4 } as any)
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateVendorMember(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ id: 4, payload: { role: 'admin' } as any })
    })

    expect(apiSpy).toHaveBeenCalledWith(4, { role: 'admin' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vendor-members'] })
  })
})
