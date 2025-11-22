export type DashboardSummary = {
  totalItems: number
  totalVendors: number
  totalCategories: number
}

// Placeholder that can be wired to a real endpoint later.
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return Promise.resolve({
    totalItems: 0,
    totalVendors: 0,
    totalCategories: 0,
  })
}
