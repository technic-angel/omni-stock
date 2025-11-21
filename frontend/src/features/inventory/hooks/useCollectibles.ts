import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchCollectibles } from '../api/collectiblesApi'
import { InventoryFiltersInput, inventoryFiltersSchema } from '../schema/filtersSchema'

export function useCollectibles(filters: InventoryFiltersInput = {}) {
  const params = useMemo(() => inventoryFiltersSchema.parse(filters), [filters])
  return useQuery({
    queryKey: ['collectibles', params],
    queryFn: () => fetchCollectibles(params),
    staleTime: 60_000,
    keepPreviousData: true
  })
}
