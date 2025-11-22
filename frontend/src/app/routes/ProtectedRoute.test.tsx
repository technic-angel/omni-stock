import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './ProtectedRoute'
import { AuthContext } from '../../features/auth/providers/AuthProvider'

const renderWithAuth = (isAuthenticated: boolean) => {
  return render(
    <AuthContext.Provider
      value={{
        accessToken: isAuthenticated ? 'token' : null,
        isAuthenticated,
        setAccessToken: () => {},
        logout: () => {},
      }}
    >
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div data-testid="protected">Protected</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    renderWithAuth(true)
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('redirects when unauthenticated', () => {
    renderWithAuth(false)
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })
})
