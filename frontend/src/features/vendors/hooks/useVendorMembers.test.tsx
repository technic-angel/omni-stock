import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useVendorMembers } from './useVendorMembers'
import * as api from '../api/vendorsApi'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper }
}

describe('useVendorMembers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches vendor members', async () => {
    const mockMembers = [{ id: 1, email: 'member@example.com' }]
    const spy = vi.spyOn(api, 'listVendorMembers').mockResolvedValue(mockMembers as any)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVendorMembers(), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(mockMembers))
    expect(spy).toHaveBeenCalled()
  })
})
