import { describe, it, expect } from 'vitest'

import { fetchDashboardSummary } from './summaryApi'

describe('fetchDashboardSummary', () => {
  it('returns schema-validated defaults', async () => {
    const summary = await fetchDashboardSummary()
    expect(summary).toEqual({
      totalItems: 0,
      totalVendors: 0,
      totalCategories: 0,
    })
  })
})
