import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useInventoryOverview } from './useInventoryOverview'
import { http } from '@/shared/lib/http'

describe('useInventoryOverview', () => {
  it('returns placeholder overview data until API exists', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({
      data: {
        stats: {
          totalSkus: 248,
          totalUnits: 500,
          lowStock: 15,
          pendingTransfers: 3,
        },
        stores: [
          {
            id: 'store-1',
            name: 'Flagship Store',
            status: 'active',
            totalSkus: 200,
            unitsOnHand: 400,
            lowStock: 10,
          },
        ],
        recentActivity: [],
      },
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useInventoryOverview(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBeTruthy())
    expect(result.current.data?.stats.totalSkus).toBe(248)
    expect(result.current.data?.stores[0]).toMatchObject({ name: 'Flagship Store' })
  })
})
