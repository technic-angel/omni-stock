import { createContext, ReactNode, useMemo, useState } from 'react'

import { tokenStore } from '../../../shared/lib/tokenStore'

type AuthContextValue = {
  accessToken: string | null
  isAuthenticated: boolean
  setAccessToken: (token: string | null) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type Props = {
  children: ReactNode
}

const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => tokenStore.getAccess() || null)

  const setAccessToken = (token: string | null) => {
    tokenStore.setAccess(token)
    setAccessTokenState(token)
  }

  const logout = () => {
    setAccessToken(null)
  }

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
