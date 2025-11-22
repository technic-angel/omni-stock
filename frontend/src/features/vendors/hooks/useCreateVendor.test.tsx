import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useCreateVendor } from './useCreateVendor'
import * as api from '../api/vendorsApi'

describe('useCreateVendor', () => {
  it('creates a vendor and invalidates vendors query', async () => {
    const spy = vi.spyOn(api, 'createVendor').mockResolvedValue({ id: 1, name: 'New Vendor' } as any)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useCreateVendor(), { wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync({ name: 'New Vendor' } as any)
    })

    expect(spy).toHaveBeenCalledWith({ name: 'New Vendor' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vendors'] })
  })
})
