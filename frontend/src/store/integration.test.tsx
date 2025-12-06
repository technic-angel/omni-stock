import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import authReducer from './slices/authSlice'
import ProtectedRoute from '../app/routes/ProtectedRoute'
import { routerFuture } from '../app/routes/routerFuture'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'

// Mock tokenStore
vi.mock('../../shared/lib/tokenStore', () => ({
  tokenStore: {
    getAccess: vi.fn(() => null),
    setAccess: vi.fn(),
    clear: vi.fn(),
  },
}))

vi.mock('@/features/auth/hooks/useCurrentUser')

const defaultAuthState = {
  accessToken: null,
  isAuthenticated: false,
  profileCompleted: false,
}

const createTestStore = (authState = defaultAuthState) => {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { ...defaultAuthState, ...authState } },
  })
}

const TestApp = ({ store, initialRoute = '/dashboard' }: { store: any; initialRoute?: string }) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[initialRoute]} future={routerFuture}>
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
  beforeEach(() => {
    vi.mocked(useCurrentUser).mockReturnValue({
      isLoading: false,
      data: null,
    } as any)
  })
  it('redirects to landing page when not authenticated', () => {
    const store = createTestStore({
      accessToken: null,
      isAuthenticated: false,
      profileCompleted: false,
    })

    render(<TestApp store={store} />)

    // Should redirect to landing page, not show dashboard
    expect(screen.getByText('Landing Page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard (Protected)')).not.toBeInTheDocument()
  })

  it('shows protected content when authenticated', () => {
    const store = createTestStore({
      accessToken: 'valid-token',
      isAuthenticated: true,
      profileCompleted: true,
    })

    render(<TestApp store={store} />)

    // Should show dashboard
    expect(screen.getByText('Dashboard (Protected)')).toBeInTheDocument()
    expect(screen.queryByText('Landing Page')).not.toBeInTheDocument()
  })

  it('redirects after token is cleared (logout)', () => {
    const store = createTestStore({
      accessToken: 'valid-token',
      isAuthenticated: true,
      profileCompleted: true,
    })

    const { rerender } = render(<TestApp store={store} />)
    expect(screen.getByText('Dashboard (Protected)')).toBeInTheDocument()

    // Simulate logout by creating new store with cleared auth
    const loggedOutStore = createTestStore({
      accessToken: null,
      isAuthenticated: false,
      profileCompleted: false,
    })

    rerender(<TestApp store={loggedOutStore} />)
    expect(screen.getByText('Landing Page')).toBeInTheDocument()
  })
})
