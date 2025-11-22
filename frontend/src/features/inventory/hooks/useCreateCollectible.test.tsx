import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useCreateCollectible } from './useCreateCollectible'
import * as api from '../api/collectiblesApi'

describe('useCreateCollectible', () => {
  it('calls create API and invalidates list', async () => {
    const spy = vi.spyOn(api, 'createCollectible').mockResolvedValue({ id: 1 } as any)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useCreateCollectible(), { wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync({ name: 'X', sku: 'Y', quantity: 1 })
    })

    expect(spy).toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collectibles'] })
  })
})
