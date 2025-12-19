import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import PublicRoute from './PublicRoute'
import { routerFuture } from './routerFuture'

const useAppSelectorMock = vi.fn()

vi.mock('../../store/hooks', () => ({
  useAppSelector: (selector: (state: any) => unknown) => useAppSelectorMock(selector),
}))

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when not authenticated', () => {
    useAppSelectorMock.mockReturnValue(false)
    render(
      <MemoryRouter initialEntries={['/login']} future={routerFuture}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div data-testid="login-form">Login</div>
              </PublicRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })

  it('redirects authenticated users to the dashboard', () => {
    useAppSelectorMock.mockReturnValue(true)
    render(
      <MemoryRouter initialEntries={['/login']} future={routerFuture}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div data-testid="login-form">Login</div>
              </PublicRoute>
            }
          />
          <Route path="/dashboard" element={<div data-testid="dashboard-home">Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('dashboard-home')).toBeInTheDocument()
  })
})
