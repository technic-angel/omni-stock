import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useInventoryOverview } from './useInventoryOverview'

describe('useInventoryOverview', () => {
  it('returns placeholder overview data until API exists', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useInventoryOverview(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBeTruthy())
    expect(result.current.data?.stats.totalSkus).toBe(248)
    expect(result.current.data?.stores[0]).toMatchObject({ name: 'Flagship Store' })
  })
})
