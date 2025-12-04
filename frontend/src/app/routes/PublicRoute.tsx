import React from 'react'
import { Navigate } from 'react-router-dom'

import { useAppSelector } from '../../store/hooks'

type Props = {
  children: React.ReactElement
}

/**
 * PublicRoute - Wrapper for public pages (landing, login, register)
 *
 * If the user is already authenticated, redirect them to the dashboard
 * instead of showing the public page.
 */
const PublicRoute = ({ children }: Props) => {
  // 📚 Redux: select isAuthenticated from store
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PublicRoute
