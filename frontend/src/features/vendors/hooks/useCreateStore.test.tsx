import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useCreateStore } from './useCreateStore'
import { createVendorStore } from '../api/vendorsApi'

vi.mock('../api/vendorsApi', () => ({
  createVendorStore: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useCreateStore', () => {
  it('executes mutation and invalidates caches', async () => {
    vi.mocked(createVendorStore).mockResolvedValue({ id: 1 } as any)
    const { result } = renderHook(() => useCreateStore(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ name: 'Flagship' } as any)
    })
    expect(createVendorStore).toHaveBeenCalledWith({ name: 'Flagship' })
  })
})
