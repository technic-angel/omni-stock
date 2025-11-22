import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import DashboardPage from './DashboardPage'

vi.mock('../hooks/useDashboardSummary', () => ({
  useDashboardSummary: () => ({
    data: { totalItems: 5, totalVendors: 2, totalCategories: 3 },
  }),
}))

describe('DashboardPage', () => {
  it('shows summary cards', () => {
    render(<DashboardPage />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
