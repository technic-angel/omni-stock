import { useQuery } from '@tanstack/react-query'
import { http } from '@/shared/lib/http'

type InventoryOverviewStats = {
  totalSkus: number
  totalUnits: number
  lowStock: number
  pendingTransfers: number
}

export type InventoryStoreSummary = {
  id: string
  name: string
  location?: string
  isDefault?: boolean
  status: 'active' | 'paused'
  totalSkus: number
  unitsOnHand: number
  lowStock: number
}

export type InventoryOverviewResponse = {
  stats: InventoryOverviewStats
  stores: InventoryStoreSummary[]
}

const fetchInventoryOverview = async (): Promise<InventoryOverviewResponse> => {
  const { data } = await http.get<InventoryOverviewResponse>('/inventory/overview/')
  return data
}

export const useInventoryOverview = () => {
  return useQuery({
    queryKey: ['inventory', 'overview'],
    queryFn: fetchInventoryOverview,
    staleTime: 5 * 60 * 1000,
  })
}
