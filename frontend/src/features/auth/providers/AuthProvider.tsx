/**
 * AuthProvider - Global Authentication State
 *
 * 📚 WHAT IS CONTEXT?
 *
 * React Context lets you share state across many components without
 * "prop drilling" (passing props through every level).
 *
 * Instead of:
 *   <App token={token}>
 *     <Dashboard token={token}>
 *       <Sidebar token={token}>
 *         <UserMenu token={token} />   // Finally uses it!
 *
 * With Context:
 *   <AuthProvider>
 *     <App>
 *       <Dashboard>
 *         <Sidebar>
 *           <UserMenu />  // Just calls useAuth() to get token!
 *
 * 📚 HOW IT WORKS
 *
 * 1. AuthProvider wraps the entire app
 * 2. It holds the token in React state
 * 3. Any component can call useAuth() to get/set the token
 * 4. When token changes, components re-render automatically
 */

import { createContext, ReactNode, useMemo, useState } from 'react'

import { tokenStore } from '../../../shared/lib/tokenStore'
import { logout as apiLogout } from '../api/authApi'

// Define what the context provides
type AuthContextValue = {
  accessToken: string | null
  isAuthenticated: boolean
  setAccessToken: (token: string | null) => void
  logout: () => void
}

// Create the context (starts as null until Provider wraps app)
export const AuthContext = createContext<AuthContextValue | null>(null)

type Props = {
  children: ReactNode
}

const AuthProvider = ({ children }: Props) => {
  // Initialize state from localStorage (so we stay logged in on refresh!)
  const [accessToken, setAccessTokenState] = useState<string | null>(() => tokenStore.getAccess())

  // Update both React state AND localStorage
  const setAccessToken = (token: string | null) => {
    tokenStore.setAccess(token)
    setAccessTokenState(token)
  }

  // Logout: clear tokens and call backend to blacklist
  const logout = async () => {
    await apiLogout() // Clear localStorage + call backend
    setAccessTokenState(null) // Update React state
  }

  // Memoize to prevent unnecessary re-renders
  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      isAuthenticated: Boolean(accessToken),
      setAccessToken,
      logout,
    }),
    [accessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

/**
 * 📚 HOW AUTH STATE FLOWS THROUGH THE APP
 *
 *                    ┌─────────────────────┐
 *                    │    AuthProvider     │
 *                    │   (wraps whole app) │
 *                    │                     │
 *                    │  state: {           │
 *                    │    accessToken      │
 *                    │    isAuthenticated  │
 *                    │  }                  │
 *                    └──────────┬──────────┘
 *                               │
 *           ┌───────────────────┼───────────────────┐
 *           │                   │                   │
 *           ▼                   ▼                   ▼
 *    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
 *    │  LoginPage  │     │ ProtectedRoute   │   │  Sidebar    │
 *    │             │     │             │     │             │
 *    │ setAccess   │     │ isAuth?     │     │ show user   │
 *    │ Token()     │     │ → redirect  │     │ avatar      │
 *    └─────────────┘     └─────────────┘     └─────────────┘
 *
 * All components can use: const { isAuthenticated, logout } = useAuth()
 */
