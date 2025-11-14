import { http } from './http'
import { tokenStore } from '../utils/tokenStore'

export async function login(username: string, password: string) {
  const { data } = await http.post('/auth/login/', { username, password })
  // Expect { access, refresh } or similar
  tokenStore.setAccess(data.access)
  return data
}

export async function refresh() {
  const { data } = await http.post('/auth/refresh/', {})
  tokenStore.setAccess(data.access)
  return data.access
}

export async function logout() {
  tokenStore.setAccess(null)
}
