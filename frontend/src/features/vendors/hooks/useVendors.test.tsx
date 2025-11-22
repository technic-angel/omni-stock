import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useVendors } from './useVendors'
import * as api from '../api/vendorsApi'

describe('useVendors', () => {
  it('fetches vendors via API', async () => {
    const mockData = [{ id: 1, name: 'Vendor A' }]
    const spy = vi.spyOn(api, 'fetchVendors').mockResolvedValue(mockData as any)

    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useVendors(), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(mockData))
    expect(spy).toHaveBeenCalled()
  })
})
