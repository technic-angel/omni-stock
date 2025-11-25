import { useQuery } from '@tanstack/react-query'
import { http } from '@/shared/lib/http'

// Dashboard summary types
export interface DashboardSummary {
  total_items: number
  total_vendors: number
  total_value: number
  items_this_month: number
  recent_items: RecentItem[]
  top_vendors: TopVendor[]
  low_stock_alerts: LowStockItem[]
}

export interface RecentItem {
  id: number
  name: string
  image_url?: string
  category: string
  price: number
  vendor: string
  created_at: string
}

export interface TopVendor {
  id: number
  name: string
  item_count: number
  total_value: number
}

export interface LowStockItem {
  id: number
  name: string
  quantity: number
  reorder_point: number
}

// Fetch dashboard summary
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await http.get('/v1/dashboard/summary/')
  return data
}

// React Query hook for dashboard
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  })
}

// Debug/test endpoint to verify backend connection
export async function testBackendConnection() {
  try {
    const { data, status } = await http.get('/health/')
    return {
      success: true,
      status,
      data,
      message: 'Backend connection successful!'
    }
  } catch (error: any) {
    return {
      success: false,
      status: error.response?.status,
      message: error.message,
      details: error.response?.data
    }
  }
}
