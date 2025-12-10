import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStore, SESSION_MAX_AGE_MS } from './tokenStore'

describe('tokenStore session handling', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  it('tracks session start when tokens are stored', () => {
    tokenStore.setTokens('access', 'refresh')
    expect(tokenStore.getAccess()).toBe('access')
    expect(tokenStore.getRefresh()).toBe('refresh')
    expect(tokenStore.hasSessionExpired()).toBe(false)
  })

  it('reports session expired after the max age', () => {
    tokenStore.setTokens('access', 'refresh')
    vi.advanceTimersByTime(SESSION_MAX_AGE_MS + 1)
    expect(tokenStore.hasSessionExpired()).toBe(true)
  })

  it('clears session timestamp on logout', () => {
    tokenStore.setTokens('foo', 'bar')
    tokenStore.clear()
    expect(tokenStore.hasSessionExpired()).toBe(false)
    expect(tokenStore.getAccess()).toBeNull()
    expect(tokenStore.getRefresh()).toBeNull()
  })
})
