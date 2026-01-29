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

const placeholderOverview: InventoryOverviewResponse = {
  stats: {
    totalSkus: 248,
    totalUnits: 1240,
    lowStock: 12,
    pendingTransfers: 5,
  },
  stores: [
    {
      id: 'flagship',
      name: 'Flagship Store',
      location: 'San Diego, CA',
      isDefault: true,
      status: 'active',
      totalSkus: 180,
      unitsOnHand: 780,
      lowStock: 9,
    },
    {
      id: 'warehouse',
      name: 'Warehouse',
      location: 'Reno, NV',
      status: 'active',
      totalSkus: 120,
      unitsOnHand: 310,
      lowStock: 2,
    },
    {
      id: 'popup',
      name: 'Popup Team',
      location: 'Austin, TX',
      status: 'paused',
      totalSkus: 88,
      unitsOnHand: 150,
      lowStock: 1,
    },
  ],
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
