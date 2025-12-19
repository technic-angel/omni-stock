import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useVendorInvites } from './useVendorInvites'
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

describe('useVendorInvites', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches vendor invites', async () => {
    const mockInvites = [{ id: 1, email: 'a@example.com' }]
    const spy = vi.spyOn(api, 'listVendorInvites').mockResolvedValue(mockInvites as any)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVendorInvites(), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(mockInvites))
    expect(spy).toHaveBeenCalled()
  })
})
