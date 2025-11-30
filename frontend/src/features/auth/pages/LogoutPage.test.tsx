/**
 * LogoutPage Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import LogoutPage from './LogoutPage'
import authReducer, { setCredentials } from '../../../store/slices/authSlice'
import * as authApi from '../api/authApi'

// Mock the auth API
vi.mock('../api/authApi', () => ({
  logout: vi.fn()
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('LogoutPage', () => {
  let store: ReturnType<typeof configureStore<{ auth: ReturnType<typeof authReducer> }>>
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    
    store = configureStore({
      reducer: { auth: authReducer }
    })
    store.dispatch(setCredentials('test-token'))
    
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
  })

  const renderLogoutPage = () => {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <LogoutPage />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    )
  }

  it('should show loading message', () => {
    vi.mocked(authApi.logout).mockImplementation(() => new Promise(() => {}))
    
    renderLogoutPage()
    
    // Initially shows "Logging out..." or "Redirecting..."
    expect(screen.getByText(/logging out|redirecting/i)).toBeInTheDocument()
  })

  it('should trigger logout on mount', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined)
    
    renderLogoutPage()
    
    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalled()
    })
  })

  it('should clear credentials after logout', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined)
    
    expect(store.getState().auth.isAuthenticated).toBe(true)
    
    renderLogoutPage()
    
    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(false)
    })
  })

  it('should navigate to home after logout', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined)
    
    renderLogoutPage()
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })
})
