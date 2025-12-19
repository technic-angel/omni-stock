import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { useVendorStores } from './useVendorStores'
import { listVendorStores } from '../api/vendorsApi'

vi.mock('../api/vendorsApi', () => ({
  listVendorStores: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useVendorStores', () => {
  it('fetches vendor stores', async () => {
    vi.mocked(listVendorStores).mockResolvedValue([{ id: 1 }] as any)
    const { result } = renderHook(() => useVendorStores(), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1 }]))
    expect(listVendorStores).toHaveBeenCalled()
  })
})
