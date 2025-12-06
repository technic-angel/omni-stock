import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import AppLayout from './AppLayout'

const mockUseMediaQuery = vi.fn()

vi.mock('@/shared/hooks/useMediaQuery', () => ({
  useMediaQuery: (query: string) => mockUseMediaQuery(query),
}))

vi.mock('./Sidebar', () => ({
  Sidebar: ({ className }: { className?: string }) => (
    <div data-testid="sidebar" data-class={className}>
      Sidebar
    </div>
  ),
  MobileSidebarTrigger: () => <button data-testid="mobile-trigger">Menu</button>,
}))

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<div data-testid="content">Dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders desktop sidebar when viewport is not mobile', () => {
    mockUseMediaQuery.mockReturnValue(false)

    renderWithRouter()

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toHaveTextContent('Dashboard')
    expect(screen.queryByTestId('mobile-trigger')).not.toBeInTheDocument()
  })

  it('shows mobile header when viewport is mobile', () => {
    mockUseMediaQuery.mockReturnValue(true)

    renderWithRouter()

    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
    expect(screen.getByTestId('mobile-trigger')).toBeInTheDocument()
    expect(screen.getByText('Omni-Stock')).toBeInTheDocument()
  })
})
