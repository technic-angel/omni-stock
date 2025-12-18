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

export type VendorCreatePayload = {
  name: string
  description?: string | null
  contact_info?: string | null
  is_active?: boolean
}

export type VendorUpdatePayload = Partial<VendorCreatePayload>

export type VendorMemberRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'member'
  | 'staff'
  | 'billing'
  | 'viewer'

export type VendorMember = {
  id: number
  user: number
  email: string
  role: VendorMemberRole
  title?: string | null
  is_active: boolean
  joined_at: string
}

export type VendorMemberPayload = {
  email: string
  role?: VendorMemberRole
  title?: string | null
  is_active?: boolean
}

export type StoreType = 'retail' | 'online' | 'popup' | 'warehouse'

export type Store = {
  id: number
  vendor_id: number
  name: string
  slug: string
  type?: StoreType | null
  description?: string | null
  address?: string | null
  metadata?: Record<string, unknown> | null
  logo_url?: string | null
  banner_url?: string | null
  currency?: string | null
  default_tax_rate?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StorePayload = {
  name: string
  type?: StoreType | null
  description?: string | null
  address?: string | null
  metadata?: Record<string, unknown> | null
  logo_url?: string | null
  banner_url?: string | null
  currency?: string | null
  default_tax_rate?: string | null
  is_active?: boolean
}

export type StoreAccessRole = 'manager' | 'sales' | 'view_only'

export type StoreAccess = {
  id: number
  store: number
  member: number
  role: StoreAccessRole
  permissions?: Record<string, unknown> | null
  is_active: boolean
}

export type StoreAccessPayload = {
  store: number
  member: number
  role?: StoreAccessRole
}

// Vendors

export const fetchVendors = () =>
  http.get<Vendor[]>('/vendors/').then(res => res.data)

export const listVendors = () =>
  http.get<Vendor[]>('/vendors/').then(res => res.data)

export const fetchVendor = (id: number) =>
  http.get<Vendor>(`/vendors/${id}/`).then(res => res.data)

export const createVendor = (payload: VendorCreatePayload) =>
  http.post<Vendor>('/vendors/', payload).then(res => res.data)

export const updateVendor = (id: number, payload: VendorUpdatePayload) =>
  http.patch<Vendor>(`/vendors/${id}/`, payload).then(res => res.data)

// Members
export const listVendorMembers = () =>
  http.get<VendorMember[]>('/vendor-members/').then(res => res.data)

export const inviteVendorMember = (payload: VendorMemberPayload) =>
  http.post<VendorMember>('/vendor-members/', payload).then(res => res.data)

export const updateVendorMember = (id: number, payload: Partial<VendorMemberPayload>) =>
  http.patch<VendorMember>(`/vendor-members/${id}/`, payload).then(res => res.data)

// Stores
export const listVendorStores = () =>
  http.get<Store[]>('/vendor-stores/').then(res => res.data)

export const createVendorStore = (payload: StorePayload) =>
  http.post<Store>('/vendor-stores/', payload).then(res => res.data)

export const updateVendorStore = (id: number, payload: Partial<StorePayload>) =>
  http.patch<Store>(`/vendor-stores/${id}/`, payload).then(res => res.data)

// Store access
export const listStoreAccess = () =>
  http.get<StoreAccess[]>('/vendor-store-access/').then(res => res.data)

export const assignStoreAccess = (payload: StoreAccessPayload) =>
  http.post<StoreAccess>('/vendor-store-access/', payload).then(res => res.data)

export const removeStoreAccess = (id: number) =>
  http.delete(`/vendor-store-access/${id}/`)
