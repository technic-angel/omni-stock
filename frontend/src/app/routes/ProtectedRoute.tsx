import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAppSelector } from '../../store/hooks'

type Props = {
  children: React.ReactElement
}

const ProtectedRoute = ({ children }: Props) => {
  // 📚 Redux: select isAuthenticated from store
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to landing page, but remember where they were trying to go
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
