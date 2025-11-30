import { describe, it, expect, beforeEach, vi } from 'vitest'
import authReducer, { setCredentials, clearCredentials } from './authSlice'

// Mock tokenStore to avoid localStorage in tests
vi.mock('../../shared/lib/tokenStore', () => ({
  tokenStore: {
    getAccess: vi.fn(() => null),
    setAccess: vi.fn(),
    clear: vi.fn(),
  }
}))

describe('authSlice', () => {
  const initialState = {
    accessToken: null,
    isAuthenticated: false,
  }

  describe('setCredentials', () => {
    it('should set the access token and mark user as authenticated', () => {
      const token = 'test-jwt-token-123'
      
      const nextState = authReducer(initialState, setCredentials(token))
      
      expect(nextState.accessToken).toBe(token)
      expect(nextState.isAuthenticated).toBe(true)
    })

    it('should update token if user logs in again', () => {
      const stateWithToken = {
        accessToken: 'old-token',
        isAuthenticated: true,
      }
      const newToken = 'new-token-456'
      
      const nextState = authReducer(stateWithToken, setCredentials(newToken))
      
      expect(nextState.accessToken).toBe(newToken)
      expect(nextState.isAuthenticated).toBe(true)
    })
  })

  describe('clearCredentials', () => {
    it('should clear the token and mark user as unauthenticated', () => {
      const stateWithToken = {
        accessToken: 'some-token',
        isAuthenticated: true,
      }
      
      const nextState = authReducer(stateWithToken, clearCredentials())
      
      expect(nextState.accessToken).toBeNull()
      expect(nextState.isAuthenticated).toBe(false)
    })

    it('should work even if already logged out', () => {
      const nextState = authReducer(initialState, clearCredentials())
      
      expect(nextState.accessToken).toBeNull()
      expect(nextState.isAuthenticated).toBe(false)
    })
  })

  describe('action types', () => {
    it('setCredentials should have correct action type', () => {
      const action = setCredentials('token')
      expect(action.type).toBe('auth/setCredentials')
    })

    it('clearCredentials should have correct action type', () => {
      const action = clearCredentials()
      expect(action.type).toBe('auth/clearCredentials')
    })
  })
})
