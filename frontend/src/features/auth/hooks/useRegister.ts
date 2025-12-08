/**
 * useRegister Hook - React Query Mutation
 *
 *
 * React Query manages "server state" - data that lives on the backend.
 * It handles:
 * - Loading states (isPending)
 * - Error states (isError, error)
 * - Success states (isSuccess, data)
 * - Caching (don't refetch if we already have data)
 * - Retries (try again if request fails)
 * - Background refetching (keep data fresh)
 *
 *    QUERIES vs MUTATIONS
 *
 * - useQuery = READ data (GET requests)
 *   Example: Fetch user profile, list of items
 *
 * - useMutation = CHANGE data (POST, PUT, DELETE)
 *   Example: Create user, update profile, delete item
 *
 * Register creates a new user, so it's a MUTATION.
 *
 * HOW useMutation WORKS
 *
 * 1. You call mutateAsync(data) or mutate(data)
 * 2. React Query calls your mutationFn with that data
 * 3. While waiting: isPending = true
 * 4. On success: isSuccess = true, data = response
 * 5. On error: isError = true, error = the error
 *
 * The component re-renders at each step, so you can show
 * loading spinners, error messages, or success states!
 */

import { useMutation } from '@tanstack/react-query'

import { register } from '../api/authApi'
import type { RegisterInput } from '../schema/authSchema'

export const useRegister = () => {
  return useMutation({
    // The function that does the actual work
    // React Query will call this when you call mutate() or mutateAsync()
    mutationFn: (payload: RegisterInput) => {
      // Call our API function with the form data
      // Note: We don't send confirmPassword - backend doesn't need it!
      const normalizedCompany = payload.company_name?.trim()
      return register(
        payload.username,
        payload.email,
        payload.first_name,
        payload.last_name,
        payload.password,
        payload.birthdate,
        normalizedCompany && normalizedCompany.length > 0 ? normalizedCompany : undefined,
      )
    },

    // Optional: callbacks for success/error
    // onSuccess: (data) => { console.log('User created!', data) },
    // onError: (error) => { console.log('Failed!', error) },
  })
}

