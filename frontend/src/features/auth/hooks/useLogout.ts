/**
 * useLogout Hook - Handle user logout
 *
 * 📚 WHAT THIS DOES:
 *
 * 1. Calls the logout API to blacklist the refresh token
 * 2. Dispatches clearCredentials to Redux (clears state + localStorage)
 * 3. Returns a logout function that can be called from anywhere
 */
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { logout as logoutApi } from '../api/authApi'
import { useAppDispatch } from '../../../store/hooks'
import { clearCredentials } from '../../../store/slices/authSlice'

export function useLogout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      // Always clear credentials, even if API call fails
      // (user should be logged out locally regardless)
      dispatch(clearCredentials())
      navigate('/', { replace: true })
    },
  })

  // Return a simple logout function
  const logout = () => mutation.mutate()

  return {
    logout,
    isLoggingOut: mutation.isPending,
  }
}
