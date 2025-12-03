/**
 * useLogin Hook - React Query Mutation
 *
 * 📚 LOGIN FLOW SUMMARY
 *
 * 1. User submits form → Component calls mutateAsync({ username, password })
 * 2. React Query calls mutationFn → Which calls login() from authApi
 * 3. login() makes POST /api/v1/auth/token/
 * 4. Backend validates credentials
 * 5. Backend returns { access, refresh } tokens
 * 6. login() stores tokens in localStorage
 * 7. mutateAsync resolves with the tokens
 * 8. Component updates AuthContext and redirects to dashboard
 *
 * Now every future request automatically includes the access token!
 * (Thanks to our axios interceptor)
 */

import { useMutation } from '@tanstack/react-query'

import { login } from '../api/authApi'
import type { LoginInput } from '../schema/authSchema'

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginInput) => {
      return login(payload.username, payload.password)
    },
  })
}

/**
 * 📚 THE COMPLETE DATA FLOW (Visual)
 *
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │                        FRONTEND                             │
 *  │                                                             │
 *  │   LoginPage                                                 │
 *  │      │                                                      │
 *  │      │ onSubmit(formData)                                   │
 *  │      ▼                                                      │
 *  │   useLogin hook                                             │
 *  │      │                                                      │
 *  │      │ mutateAsync(formData)                                │
 *  │      ▼                                                      │
 *  │   React Query                                               │
 *  │      │ isPending = true                                     │
 *  │      │ calls mutationFn                                     │
 *  │      ▼                                                      │
 *  │   authApi.login()                                           │
 *  │      │                                                      │
 *  │      │ http.post('/v1/auth/token/')                         │
 *  │      ▼                                                      │
 *  │   Axios                                                     │
 *  │      │                                                      │
 *  └──────┼──────────────────────────────────────────────────────┘
 *         │ HTTP POST with { username, password }
 *         ▼
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │                        BACKEND                              │
 *  │                                                             │
 *  │   Django receives POST /api/v1/auth/token/                  │
 *  │      │                                                      │
 *  │      ▼                                                      │
 *  │   Check username/password in database                       │
 *  │      │                                                      │
 *  │      ▼                                                      │
 *  │   Generate JWT tokens (access + refresh)                    │
 *  │      │                                                      │
 *  │      ▼                                                      │
 *  │   Return { access: "eyJ...", refresh: "eyJ..." }            │
 *  │                                                             │
 *  └──────┼──────────────────────────────────────────────────────┘
 *         │ HTTP 200 OK
 *         ▼
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │                        FRONTEND                             │
 *  │                                                             │
 *  │   Axios receives response                                   │
 *  │      │                                                      │
 *  │      ▼                                                      │
 *  │   authApi.login() stores tokens in localStorage             │
 *  │      │                                                      │
 *  │      ▼                                                      │
 *  │   React Query: isPending = false, isSuccess = true          │
 *  │      │                                                      │
 *  │      ▼                                                      │
 *  │   LoginPage: await mutateAsync() resolves                   │
 *  │      │                                                      │
 *  │      ▼                                                      │
 *  │   setAccessToken() → AuthContext updates                    │
 *  │      │                                                      │
 *  │      ▼                                                      │
 *  │   navigate('/dashboard') → User sees the app!               │
 *  │                                                             │
 *  └─────────────────────────────────────────────────────────────┘
 */
