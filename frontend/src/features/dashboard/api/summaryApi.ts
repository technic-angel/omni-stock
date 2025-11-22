import { dashboardSummarySchema, type DashboardSummary } from '../schema/summarySchema'

// Placeholder that can be wired to a real endpoint later.
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const data = {
    totalItems: 0,
    totalVendors: 0,
    totalCategories: 0,
  }
  return dashboardSummarySchema.parse(data)
}
