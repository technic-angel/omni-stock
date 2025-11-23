import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useCollectible } from './useCollectible'
import * as api from '../api/collectiblesApi'

describe('useCollectible', () => {
  it('fetches collectible by id', async () => {
    const spy = vi.spyOn(api, 'fetchCollectible').mockResolvedValue({ id: 5 } as any)
    const queryClient = new QueryClient()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useCollectible(5), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(5)
  })
})
