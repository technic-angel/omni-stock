import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import ProtectedRoute from './ProtectedRoute'
import { routerFuture } from './routerFuture'
import authReducer from '../../store/slices/authSlice'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'

vi.mock('@/features/auth/hooks/useCurrentUser')

const createTestStore = (isAuthenticated: boolean, profileCompleted = true) => {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        accessToken: isAuthenticated ? 'test-token' : null,
        isAuthenticated,
        profileCompleted,
      },
    },
  })
}

type RenderOptions = {
  isAuthenticated: boolean
  profileCompleted?: boolean
  initialPath?: string
}

const renderWithAuth = ({
  isAuthenticated,
  profileCompleted = true,
  initialPath = '/protected',
}: RenderOptions) => {
  const store = createTestStore(isAuthenticated, profileCompleted)
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]} future={routerFuture}>
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
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <div data-testid="onboarding-page">Onboarding</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={<div data-testid="dashboard-page">Dashboard</div>}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCurrentUser).mockReturnValue({
      isLoading: false,
      data: null,
    } as any)
  })

  it('renders children when authenticated', () => {
    renderWithAuth({ isAuthenticated: true })
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('redirects to landing page when unauthenticated', () => {
    renderWithAuth({ isAuthenticated: false })
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
  })

  it('waits for current user query before redirecting', () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      isLoading: true,
      data: null,
    } as any)
    renderWithAuth({ isAuthenticated: true })

    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument()
  })

  it('redirects incomplete profiles to onboarding', () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      isLoading: false,
      data: { profile_completed: false },
    } as any)
    renderWithAuth({ isAuthenticated: true, profileCompleted: false, initialPath: '/protected' })

    expect(screen.getByTestId('onboarding-page')).toBeInTheDocument()
  })

  it('sends completed users away from onboarding route', () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      isLoading: false,
      data: { profile_completed: true },
    } as any)
    renderWithAuth({ isAuthenticated: true, profileCompleted: true, initialPath: '/onboarding' })

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
  })
})
