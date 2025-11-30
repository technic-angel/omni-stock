import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import authReducer from './slices/authSlice'
import ProtectedRoute from '../app/routes/ProtectedRoute'

// Mock tokenStore
vi.mock('../../shared/lib/tokenStore', () => ({
  tokenStore: {
    getAccess: vi.fn(() => null),
    setAccess: vi.fn(),
    clear: vi.fn(),
  }
}))

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  })
}

const TestApp = ({ store, initialRoute = '/dashboard' }: { store: any; initialRoute?: string }) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<div>Landing Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Dashboard (Protected)</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  </Provider>
)

describe('ProtectedRoute with Redux', () => {
  it('redirects to landing page when not authenticated', () => {
    const store = createTestStore({
      auth: { accessToken: null, isAuthenticated: false }
    })

    render(<TestApp store={store} />)

    // Should redirect to landing page, not show dashboard
    expect(screen.getByText('Landing Page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard (Protected)')).not.toBeInTheDocument()
  })

  it('shows protected content when authenticated', () => {
    const store = createTestStore({
      auth: { accessToken: 'valid-token', isAuthenticated: true }
    })

    render(<TestApp store={store} />)

    // Should show dashboard
    expect(screen.getByText('Dashboard (Protected)')).toBeInTheDocument()
    expect(screen.queryByText('Landing Page')).not.toBeInTheDocument()
  })

  it('redirects after token is cleared (logout)', () => {
    const store = createTestStore({
      auth: { accessToken: 'valid-token', isAuthenticated: true }
    })

    const { rerender } = render(<TestApp store={store} />)
    expect(screen.getByText('Dashboard (Protected)')).toBeInTheDocument()

    // Simulate logout by creating new store with cleared auth
    const loggedOutStore = createTestStore({
      auth: { accessToken: null, isAuthenticated: false }
    })

    rerender(<TestApp store={loggedOutStore} />)
    expect(screen.getByText('Landing Page')).toBeInTheDocument()
  })
})
