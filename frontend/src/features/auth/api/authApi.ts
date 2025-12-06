import { http } from '../../../shared/lib/http'
import { tokenStore } from '../../../shared/lib/tokenStore'

export type RegisterResponse = {
  id: number
  username: string
}

export type CheckEmailResponse = {
  available: boolean
}

export type LoginResponse = {
  access: string
  refresh: string
}

type RefreshResponse = {
  access: string
}

export type CurrentUserResponse = {
  id: number
  username: string
  email: string
  role: string
  profile_completed: boolean
  profile?: {
    id: number
    phone?: string | null
    bio?: string | null
    profile_picture?: string | null
  } | null
}

export type CompleteProfilePayload = {
  username: string
  password: string
  company_name?: string | null
  company_site?: string | null
  company_code?: string | null
  phone_number?: string | null
  birthdate?: string | null
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const { data } = await http.post<RegisterResponse>('/auth/register/', {
    username,
    email,
    password,
  })
  return data
}

export async function checkEmailAvailability(email: string): Promise<CheckEmailResponse> {
  const { data } = await http.post<CheckEmailResponse>('/auth/register/check-email/', {
    email,
  })
  return data
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/auth/token/', {
    username,
    password,
  })

  tokenStore.setTokens(data.access, data.refresh)

  return data
}

export async function refreshToken(): Promise<string> {
  const refresh = tokenStore.getRefresh()

  if (!refresh) {
    throw new Error('No refresh token available')
  }

  const { data } = await http.post<RefreshResponse>('/auth/token/refresh/', {
    refresh,
  })

  tokenStore.setAccess(data.access)

  return data.access
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const { data } = await http.get<CurrentUserResponse>('/auth/me/')
  return data
}

export async function completeProfile(payload: CompleteProfilePayload): Promise<CurrentUserResponse> {
  const { data } = await http.post<CurrentUserResponse>('/auth/profile/complete/', payload)
  return data
}

export async function logout(): Promise<void> {
  const refresh = tokenStore.getRefresh()

  if (refresh) {
    try {
      await http.post('/auth/logout/', { refresh })
    } catch {
      // Swallow errors; still clear local tokens
    }
  }

  tokenStore.clear()
}
