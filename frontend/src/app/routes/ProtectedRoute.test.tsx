import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import ProtectedRoute from './ProtectedRoute'
import { routerFuture } from './routerFuture'
import authReducer from '../../store/slices/authSlice'
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

const createTestStore = (isAuthenticated: boolean) => {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        accessToken: isAuthenticated ? 'test-token' : null,
        isAuthenticated,
        profileCompleted: isAuthenticated,
      },
    },
  })
}

beforeEach(() => {
  vi.mocked(useCurrentUser).mockReturnValue({
    isLoading: false,
    data: null,
  } as any)
})

const renderWithAuth = (isAuthenticated: boolean) => {
  const store = createTestStore(isAuthenticated)
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']} future={routerFuture}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div data-testid="protected">Protected</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div data-testid="landing-page">Landing</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    renderWithAuth(true)
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('redirects to landing page when unauthenticated', () => {
    renderWithAuth(false)
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
  })
})
