/**
 * useLogout Hook Tests
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import { useLogout } from './useLogout'
import { routerFuture } from '../../../app/routes/routerFuture'
import authReducer, { setCredentials } from '../../../store/slices/authSlice'
import * as authApi from '../api/authApi'

// Mock the auth API
vi.mock('../api/authApi', () => ({
  logout: vi.fn(),
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('useLogout', () => {
  let store: ReturnType<typeof configureStore<{ auth: ReturnType<typeof authReducer> }>>
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()

    // Create fresh store with logged-in state
    store = configureStore({
      reducer: { auth: authReducer },
    })
    store.dispatch(setCredentials('test-token'))

    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter future={routerFuture}>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>
  )

  it('should clear credentials and navigate on logout', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined)

    const { result } = renderHook(() => useLogout(), { wrapper })

    // Initially authenticated
    expect(store.getState().auth.isAuthenticated).toBe(true)

    // Trigger logout
    act(() => {
      result.current.logout()
    })

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(false)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('should still clear credentials if API fails', async () => {
    vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useLogout(), { wrapper })

    act(() => {
      result.current.logout()
    })

    // Should still clear credentials even if API fails
    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(false)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('should return isLoggingOut state', async () => {
    let resolveLogout: () => void
    vi.mocked(authApi.logout).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogout = resolve
        }),
    )

    const { result } = renderHook(() => useLogout(), { wrapper })

    expect(result.current.isLoggingOut).toBe(false)

    act(() => {
      result.current.logout()
    })

    // Wait for the mutation to start
    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(true)
    })

    await act(async () => {
      resolveLogout!()
    })

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false)
    })
  })
})
