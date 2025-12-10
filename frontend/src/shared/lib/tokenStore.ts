/**
 * Token Store - Manages JWT tokens and session state in localStorage
 */

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const SESSION_STARTED_AT_KEY = 'session_started_at'
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000 // 12 hours

function ensureSessionStarted(force = false) {
  if (force || !localStorage.getItem(SESSION_STARTED_AT_KEY)) {
    localStorage.setItem(SESSION_STARTED_AT_KEY, Date.now().toString())
  }
}

function clearSessionStart() {
  localStorage.removeItem(SESSION_STARTED_AT_KEY)
}

export const tokenStore = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  setAccess(token: string | null, options?: { resetSession?: boolean }): void {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
      ensureSessionStarted(options?.resetSession ?? false)
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    }
  },

  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setRefresh(token: string | null): void {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
      ensureSessionStarted()
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  },

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    clearSessionStart()
  },

  setTokens(access: string, refresh: string): void {
    ensureSessionStarted(true)
    this.setAccess(access)
    this.setRefresh(refresh)
  },

  hasSessionExpired(maxAgeMs: number = SESSION_MAX_AGE_MS): boolean {
    const startedAt = localStorage.getItem(SESSION_STARTED_AT_KEY)
    if (!startedAt) {
      return false
    }
    const started = Number(startedAt)
    if (!Number.isFinite(started)) {
      return true
    }
    return Date.now() - started > maxAgeMs
  },
}

export { SESSION_MAX_AGE_MS }
