import { http } from '../../../shared/lib/http'

export type Vendor = {
  id: number
  name: string
  description?: string | null
  contact_info?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export async function fetchVendors() {
  const { data } = await http.get<Vendor[]>('/vendors/')
  return data
}

export async function fetchCurrentVendor() {
  const { data } = await http.get<Vendor>('/vendors/me/')
  return data
}

export async function createVendor(payload: Partial<Vendor>) {
  const { data } = await http.post<Vendor>('/vendors/', payload)
  return data
}
