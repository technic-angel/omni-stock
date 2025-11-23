import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { useUpdateCollectible } from './useUpdateCollectible'
import * as api from '../api/collectiblesApi'

describe('useUpdateCollectible', () => {
  it('updates collectible and invalidates caches', async () => {
    const spy = vi.spyOn(api, 'updateCollectible').mockResolvedValue({ id: 3 } as any)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useUpdateCollectible(3), { wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync({ name: 'Updated' })
    })

    expect(spy).toHaveBeenCalledWith(3, { name: 'Updated' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collectibles'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collectible', 3] })
  })
})
