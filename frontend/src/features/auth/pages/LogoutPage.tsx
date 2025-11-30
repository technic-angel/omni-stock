/**
 * LogoutPage - Handles user logout
 * 
 * 📚 WHAT THIS DOES:
 * 
 * This page immediately triggers logout when mounted.
 * It shows a brief "Logging out..." message while the API call happens.
 * 
 * This pattern allows logout to be a route (/logout) that can be
 * linked to from anywhere in the app.
 */
import React, { useEffect } from 'react'
import { useLogout } from '../hooks/useLogout'

const LogoutPage = () => {
  const { logout, isLoggingOut } = useLogout()

  // Trigger logout on mount
  useEffect(() => {
    logout()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4" />
        <p className="text-gray-600">
          {isLoggingOut ? 'Logging out...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  )
}

export default LogoutPage
