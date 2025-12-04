/**
 * Token Store - Manages JWT tokens in localStorage
 */

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const tokenStore = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  setAccess(token: string | null): void {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
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
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  },

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  setTokens(access: string, refresh: string): void {
    this.setAccess(access)
    this.setRefresh(refresh)
  },
}
