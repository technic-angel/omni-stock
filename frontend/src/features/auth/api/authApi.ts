import { http } from '../../../shared/lib/http'
import { tokenStore } from '../../../shared/lib/tokenStore'

// Backend endpoints are mounted under /api/v1/...
export async function register(username: string, email: string, password: string) {
  const { data } = await http.post('/v1/auth/register/', { username, email, password })
  return data
}

export async function login(username: string, password: string) {
  const { data } = await http.post('/v1/auth/token/', { username, password })
  // Expect { access, refresh }
  tokenStore.setAccess(data.access)
  return data
}

export async function refresh() {
  const { data } = await http.post('/v1/auth/token/refresh/', {})
  tokenStore.setAccess(data.access)
  return data.access
}

export async function logout() {
  tokenStore.setAccess(null)
}
