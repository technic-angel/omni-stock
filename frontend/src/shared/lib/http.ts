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

import axios from 'axios'
import { tokenStore } from './tokenStore'

// Callback for handling 401 errors - will be set by the app
let onUnauthorized: (() => void) | null = null

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
function getApiBaseUrl(): string {
  // Check if we're on Vercel FIRST - always use hardcoded production URL
  // This prevents any misconfigured Vercel env vars from breaking things
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://omni-stock.onrender.com/api/v1'
  }
  
  // Local development - use VITE_API_BASE from .env (only checked when NOT on Vercel)
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE
  }
  
  // Fallback for local dev without .env
  return 'http://localhost:8000/api/v1'
}

const apiBaseUrl = getApiBaseUrl()

// Log the API base URL for debugging on Vercel
if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
  console.log('[HTTP] API Base URL:', apiBaseUrl)
}

// Create a configured axios instance
export const http = axios.create({
  // Base URL - all requests will be prefixed with this
  baseURL: apiBaseUrl,
  
  // Don't wait more than 10 seconds for a response
  timeout: 10000,
  
  // Default headers sent with every request
  headers: {
    'Content-Type': 'application/json',  // We're sending JSON
    'Accept': 'application/json'          // We want JSON back
  }
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
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      // Call the handler to clear Redux state and localStorage
      if (onUnauthorized) {
        onUnauthorized()
      }
    }
    
    // Always reject so the calling code knows there was an error
    return Promise.reject(error)
  }
)

