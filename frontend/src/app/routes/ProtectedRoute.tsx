import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAppSelector } from '../../store/hooks'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'

type Props = {
  children: React.ReactElement
}

const ProtectedRoute = ({ children }: Props) => {
  // 📚 Redux: select isAuthenticated from store
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const profileCompleted = useAppSelector((state) => state.auth.profileCompleted)
  const location = useLocation()
  const { isLoading } = useCurrentUser({ enabled: isAuthenticated })

  if (!isAuthenticated) {
    // Redirect to landing page, but remember where they were trying to go
    return <Navigate to="/" replace state={{ from: location }} />
  }

  if (isLoading) {
    return null
  }

  const isOnOnboardingRoute = location.pathname.startsWith('/onboarding')
  if (!profileCompleted && !isOnOnboardingRoute) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />
  }
  if (profileCompleted && isOnOnboardingRoute) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
