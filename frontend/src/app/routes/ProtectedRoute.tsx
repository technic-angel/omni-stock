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
  const profileCompletedFromStore = useAppSelector((state) => state.auth.profileCompleted)
  const location = useLocation()

  // Use the current user query so we can inspect server value immediately
  const currentUserQuery = useCurrentUser({ enabled: isAuthenticated })
  const { isLoading, data: currentUser } = currentUserQuery
  // Prefer server value when available (avoids transient redirects before effect runs)
  const profileCompleted = currentUser?.profile_completed ?? profileCompletedFromStore

  if (!isAuthenticated) {
    // Redirect to landing page, but remember where they were trying to go
    return <Navigate to="/" replace state={{ from: location }} />
  }

  // Wait while the current user query is performing its initial load.
  // This avoids redirecting to onboarding before we know the server state.
  if (isLoading && !currentUser) {
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
