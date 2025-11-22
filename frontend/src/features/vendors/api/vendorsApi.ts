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
  const { data } = await http.get<Vendor[]>('/v1/vendors/')
  return data
}

export async function createVendor(payload: Partial<Vendor>) {
  const { data } = await http.post<Vendor>('/v1/vendors/', payload)
  return data
}
