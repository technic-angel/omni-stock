/**
 * HTTP Client - Axios Configuration
 *
 * 📚 WHAT IS AXIOS?
 *
 * Axios is a library that makes HTTP requests. It's like the browser's
 * built-in `fetch()` but with extra features:
 * - Automatic JSON parsing
 * - Request/response interceptors (middleware)
 * - Better error handling
 * - Timeout support
 *
 * 📚 WHY CREATE AN INSTANCE?
 *
 * Instead of configuring axios every time, we create ONE configured
 * instance that all our API calls will use. This sets:
 * - Base URL (so we don't repeat "/api" everywhere)
 * - Default headers (Content-Type, Accept)
 * - Timeout (don't wait forever for slow servers)
 */

import axios, { type AxiosRequestConfig } from 'axios'
import { tokenStore } from './tokenStore'

// Callback for handling 401 errors - will be set by the app
let onUnauthorized: (() => void) | null = null

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean }

let isRefreshing = false
let pendingRequests: Array<(token: string | null) => void> = []

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  pendingRequests.push(cb)
}

function resolvePending(token: string | null) {
  pendingRequests.forEach((cb) => cb(token))
  pendingRequests = []
}

/**
 * Set the callback to be called when a 401 response is received.
 * This is called from AppProviders to connect to Redux.
 */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

/**
 * Determine the API base URL based on environment
 *
 * PRODUCTION: https://omni-stock.onrender.com/api/v1
 * LOCAL DEV:  http://localhost:8000/api/v1 (from VITE_API_BASE)
 */
function ensureApiPath(url: string): string {
  if (!url) return ''
  if (url.endsWith('/api/v1')) {
    return url
  }
  const normalized = url.replace(/\/+$/, '')
  return `${normalized}/api/v1`
}

function getApiBaseUrl(): string {
  const envBase = ensureApiPath((import.meta.env.VITE_API_BASE || '').trim())
  if (envBase.length > 0) {
    return envBase
  }

  // No explicit env override, fall back based on host
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://omni-stock.onrender.com/api/v1'
  }

  // Fallback for local dev without .env
  return 'http://localhost:8000/api/v1'
}

const apiBaseUrl = getApiBaseUrl()

// Create a configured axios instance
export const http = axios.create({
  // Base URL - all requests will be prefixed with this
  baseURL: apiBaseUrl,

  // Don't wait more than 10 seconds for a response
  timeout: 10000,

  // Default headers sent with every request
  headers: {
    'Content-Type': 'application/json', // We're sending JSON
    Accept: 'application/json', // We want JSON back
  },
})

/**
 * 📚 REQUEST INTERCEPTOR
 *
 * An interceptor is middleware that runs BEFORE every request.
 * This one automatically adds the JWT token to every request.
 *
 * Without this, you'd have to manually add the token every time:
 *   http.get('/v1/users', { headers: { Authorization: `Bearer ${token}` }})
 *
 * With the interceptor, the token is added automatically!
 */
http.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()

  if (token && config.headers) {
    // Add the JWT token to the Authorization header
    // Format: "Bearer eyJhbGciOiJIUzI1NiIs..."
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/**
 * 📚 RESPONSE INTERCEPTOR - Handle 401 Unauthorized
 *
 * This interceptor runs AFTER every response.
 * If we get a 401 (invalid/expired token), we:
 * 1. Call the unauthorized handler (clears Redux state)
 * 2. Let the error propagate
 *
 * The handler is set by AppProviders to dispatch clearCredentials.
 */
http.interceptors.response.use(
  // Success - just pass through
  (response) => response,

  // Error - check for 401
  async (error) => {
    if (error.response?.status === 401) {
      const originalRequest = (error.config || {}) as RetryableConfig

      if (originalRequest._retry) {
        if (onUnauthorized) {
          onUnauthorized()
        }
        return Promise.reject(error)
      }

      const refresh = tokenStore.getRefresh()
      if (!refresh || tokenStore.hasSessionExpired()) {
        if (onUnauthorized) {
          onUnauthorized()
        }
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) {
              reject(error)
              return
            }
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(http(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const newAccessToken = await refreshAccessToken(refresh)
        tokenStore.setAccess(newAccessToken)
        resolvePending(newAccessToken)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return http(originalRequest)
      } catch (refreshError) {
        resolvePending(null)
        if (onUnauthorized) {
          onUnauthorized()
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Always reject so the calling code knows there was an error
    return Promise.reject(error)
  },
)

async function refreshAccessToken(refresh: string): Promise<string> {
  const response = await axios.post(
    `${apiBaseUrl}/auth/token/refresh/`,
    { refresh },
    { headers: { 'Content-Type': 'application/json' } },
  )
  return response.data.access
}
