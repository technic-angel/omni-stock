import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useSelectVendor } from './useSelectVendor'
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

describe('useSelectVendor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls API and invalidates caches', async () => {
    const apiSpy = vi.spyOn(api, 'selectVendorMembership').mockResolvedValue({ id: 1 } as any)
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useSelectVendor(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(1)
    })

    expect(apiSpy).toHaveBeenCalledWith(1)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['currentUser'] })
  })
})
