import { useMutation } from '@tanstack/react-query'

import { checkEmailAvailability } from '../api/authApi'

/**
 * useCheckEmail - mutation hook to validate email availability.
 *
 * The endpoint is triggered manually (form submit), so we model it as a mutation
 * rather than a cached query. React Query tracks pending/error states for us.
 */
export const useCheckEmail = () => {
  return useMutation({
    mutationFn: (email: string) => checkEmailAvailability(email),
  })
}
