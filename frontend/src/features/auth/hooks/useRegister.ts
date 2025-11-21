import { useMutation } from '@tanstack/react-query'

import { register } from '../api/authApi'
import type { RegisterInput } from '../schema/authSchema'

export const useRegister = () => {
  return useMutation({
    mutationFn: (payload: RegisterInput) => register(payload.username, payload.email, payload.password),
  })
}
