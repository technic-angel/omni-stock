import { useMutation } from '@tanstack/react-query'

import { login } from '../api/authApi'
import type { LoginInput } from '../schema/authSchema'

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginInput) => login(payload.username, payload.password),
  })
}
