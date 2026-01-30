import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import DashboardPage from './DashboardPage'

import { useInventoryOverview } from '../../inventory/hooks/useInventoryOverview'

vi.mock('../../inventory/hooks/useInventoryOverview', () => ({
  useInventoryOverview: () => ({
    data: {
      stats: { totalSkus: 5, totalUnits: 10, lowStock: 2, pendingTransfers: 1 },
      stores: [],
      recentActivity: []
    },
    isLoading: false,
    error: null
  }),
}))

describe('DashboardPage', () => {
  it('shows summary cards', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Total SKUs')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    
    expect(screen.getByText('Units On Hand')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()

    expect(screen.getByText('Low Stock Items')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
