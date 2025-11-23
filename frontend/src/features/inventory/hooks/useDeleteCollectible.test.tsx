import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { useDeleteCollectible } from './useDeleteCollectible'
import * as api from '../api/collectiblesApi'

describe('useDeleteCollectible', () => {
  it('deletes collectible and invalidates caches', async () => {
    const spy = vi.spyOn(api, 'deleteCollectible').mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useDeleteCollectible(), { wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync(10)
    })

    expect(spy).toHaveBeenCalledWith(10)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collectibles'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collectible', 10] })
  })
})
