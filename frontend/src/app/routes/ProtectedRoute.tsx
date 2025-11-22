import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'

type Props = {
  children: React.ReactElement
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
