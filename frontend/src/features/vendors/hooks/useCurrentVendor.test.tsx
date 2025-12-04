import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { useCurrentVendor } from './useCurrentVendor'
import * as api from '../api/vendorsApi'

describe('useCurrentVendor', () => {
  it('fetches current vendor via API', async () => {
    const spy = vi
      .spyOn(api, 'fetchCurrentVendor')
      .mockResolvedValue({ id: 1, name: 'Vendor A' } as any)
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useCurrentVendor(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalled()
  })
})
