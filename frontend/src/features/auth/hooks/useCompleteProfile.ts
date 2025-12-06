import { useMutation } from '@tanstack/react-query'

import { completeProfile, CompleteProfilePayload } from '../api/authApi'

export const useCompleteProfile = () => {
  return useMutation({
    mutationFn: (payload: CompleteProfilePayload) => completeProfile(payload),
  })
}
