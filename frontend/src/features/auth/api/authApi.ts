/**
 * Auth API - Backend Communication
 *
 * 📚 THE API LAYER
 *
 * This file contains functions that talk to the backend.
 * Each function:
 * 1. Makes an HTTP request using our configured axios instance
 * 2. Returns the data from the response
 *
 * These are PLAIN FUNCTIONS - they don't know about React.
 * React Query hooks will call these functions.
 *
 * 📚 WHY SEPARATE API FUNCTIONS?
 *
 * - Easy to test (just call the function, check the result)
 * - Reusable (can be called from hooks, tests, etc.)
 * - Single source of truth for endpoints
 */

import { http } from '../../../shared/lib/http'
import { tokenStore } from '../../../shared/lib/tokenStore'

// ─────────────────────────────────────────────────────────────
// REGISTER - Create a new user account
// ─────────────────────────────────────────────────────────────
//
// 📚 THE FLOW:
//
// 1. Frontend sends: { username, email, password }
// 2. Backend creates user in database
// 3. Backend returns: { id, username, email } (the new user)
//
// Note: Register does NOT return tokens! User must login after.
// Some apps auto-login after register, but we keep it simple.

export async function register(username: string, email: string, password: string) {
  // POST /api/v1/auth/register/
  const { data } = await http.post('/auth/register/', {
    username,
    email,
    password,
    // Note: We don't send confirmPassword to backend!
    // That's only for frontend validation
  })
  return data
}

// ─────────────────────────────────────────────────────────────
// LOGIN - Authenticate and get tokens
// ─────────────────────────────────────────────────────────────
//
// 📚 THE FLOW:
//
// 1. Frontend sends: { username, password }
// 2. Backend checks credentials
// 3. Backend returns: { access: "jwt...", refresh: "jwt..." }
// 4. We store both tokens for later use
//
// The access token is then attached to every request (by interceptor)

export async function login(username: string, password: string) {
  // POST /api/v1/auth/token/
  const { data } = await http.post('/auth/token/', {
    username,
    password,
  })

  // Store the tokens we received
  tokenStore.setTokens(data.access, data.refresh)

  return data // { access, refresh }
}

// ─────────────────────────────────────────────────────────────
// REFRESH - Get a new access token
// ─────────────────────────────────────────────────────────────
//
// 📚 WHY REFRESH?
//
// Access tokens expire quickly (15 min) for security.
// Instead of making user login again, we use the refresh token
// to get a new access token silently in the background.
//
// This is usually called automatically when a request fails with 401.

export async function refreshToken() {
  const refresh = tokenStore.getRefresh()

  if (!refresh) {
    throw new Error('No refresh token available')
  }

  // POST /api/v1/auth/token/refresh/
  const { data } = await http.post('/auth/token/refresh/', {
    refresh,
  })

  // Store the new access token
  tokenStore.setAccess(data.access)

  return data.access
}

// ─────────────────────────────────────────────────────────────
// LOGOUT - Clear tokens and invalidate on server
// ─────────────────────────────────────────────────────────────
//
// 📚 LOGOUT STRATEGIES:
//
// Simple: Just delete tokens from localStorage
// Better: Also tell the backend to blacklist the refresh token
//         (so it can't be used even if someone stole it)

export async function logout() {
  const refresh = tokenStore.getRefresh()

  // Try to blacklist the refresh token on the server
  if (refresh) {
    try {
      await http.post('/auth/logout/', { refresh })
    } catch {
      // If this fails, still clear local tokens
      // (maybe user is already logged out, or server is down)
    }
  }

  // Always clear local tokens
  tokenStore.clear()
}
