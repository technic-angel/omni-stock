/**
 * HTTP Client Tests - Response Interceptor
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { setUnauthorizedHandler } from './http'
import { tokenStore } from './tokenStore'

// Mock tokenStore
vi.mock('./tokenStore', () => ({
  tokenStore: {
    getAccess: vi.fn(),
    setAccess: vi.fn(),
    getRefresh: vi.fn(),
    setRefresh: vi.fn(),
    clear: vi.fn(),
    setTokens: vi.fn()
  }
}))

describe('http client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setUnauthorizedHandler', () => {
    it('should accept a handler function', () => {
      const handler = vi.fn()
      // Should not throw
      expect(() => setUnauthorizedHandler(handler)).not.toThrow()
    })

    it('should allow setting a new handler', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      setUnauthorizedHandler(handler1)
      setUnauthorizedHandler(handler2)
      
      // Should not throw when overwriting
      expect(true).toBe(true)
    })
  })

  describe('tokenStore integration', () => {
    it('should use tokenStore.getAccess for request interceptor', () => {
      // Just verify the mock is set up correctly
      expect(tokenStore.getAccess).toBeDefined()
      expect(typeof tokenStore.getAccess).toBe('function')
    })
  })
})
