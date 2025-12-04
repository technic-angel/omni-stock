import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, { setCredentials, clearCredentials } from './slices/authSlice'

describe('Redux Store', () => {
  const createTestStore = () => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      // Disable serializable check for testing
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    })
  }

  it('should have initial state with no auth', () => {
    const store = createTestStore()
    const state = store.getState()

    expect(state.auth.accessToken).toBeNull()
    expect(state.auth.isAuthenticated).toBe(false)
  })

  it('should update state when setCredentials is dispatched', () => {
    const store = createTestStore()
    const token = 'my-jwt-token'

    store.dispatch(setCredentials(token))

    const state = store.getState()
    expect(state.auth.accessToken).toBe(token)
    expect(state.auth.isAuthenticated).toBe(true)
  })

  it('should clear state when clearCredentials is dispatched', () => {
    const store = createTestStore()

    // First login
    store.dispatch(setCredentials('token'))
    expect(store.getState().auth.isAuthenticated).toBe(true)

    // Then logout
    store.dispatch(clearCredentials())

    const state = store.getState()
    expect(state.auth.accessToken).toBeNull()
    expect(state.auth.isAuthenticated).toBe(false)
  })

  it('should handle full login/logout cycle', () => {
    const store = createTestStore()

    // Start logged out
    expect(store.getState().auth.isAuthenticated).toBe(false)

    // Login
    store.dispatch(setCredentials('access-token-1'))
    expect(store.getState().auth.isAuthenticated).toBe(true)
    expect(store.getState().auth.accessToken).toBe('access-token-1')

    // Token refresh (new token)
    store.dispatch(setCredentials('access-token-2'))
    expect(store.getState().auth.accessToken).toBe('access-token-2')

    // Logout
    store.dispatch(clearCredentials())
    expect(store.getState().auth.isAuthenticated).toBe(false)
    expect(store.getState().auth.accessToken).toBeNull()
  })
})
