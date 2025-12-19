import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  fetchVendors,
  fetchVendor,
  createVendor,
  listVendorMembers,
  inviteVendorMember,
  updateVendorMember,
  listVendorInvites,
  acceptVendorInvite,
  declineVendorInvite,
  listVendorStores,
  createVendorStore,
  updateVendorStore,
  listStoreAccess,
  assignStoreAccess,
  removeStoreAccess,
  selectVendorMembership,
  selectVendorStore,
} from './vendorsApi'
import { http } from '../../../shared/lib/http'

vi.mock('../../../shared/lib/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockGet = vi.mocked(http.get)
const mockPost = vi.mocked(http.post)
const mockPatch = vi.mocked(http.patch)
const mockDelete = vi.mocked(http.delete)

describe('vendorsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches vendor list', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 1 }] })
    const data = await fetchVendors()
    expect(mockGet).toHaveBeenCalledWith('/vendors/')
    expect(data).toEqual([{ id: 1 }])
  })

  it('fetches vendor by id', async () => {
    mockGet.mockResolvedValue({ data: { id: 5 } })
    const data = await fetchVendor(5)
    expect(mockGet).toHaveBeenCalledWith('/vendors/5/')
    expect(data).toEqual({ id: 5 })
  })

  it('creates a new vendor', async () => {
    mockPost.mockResolvedValue({ data: { id: 7 } })
    const payload = { name: 'Vendor' }
    const data = await createVendor(payload)
    expect(mockPost).toHaveBeenCalledWith('/vendors/', payload)
    expect(data).toEqual({ id: 7 })
  })

  it('selects a vendor membership', async () => {
    mockPost.mockResolvedValue({ data: { id: 12 } })
    const data = await selectVendorMembership(12)
    expect(mockPost).toHaveBeenCalledWith('/vendor-members/select/', { vendor: 12 })
    expect(data).toEqual({ id: 12 })
  })

  it('lists vendor members', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 2 }] })
    const data = await listVendorMembers()
    expect(mockGet).toHaveBeenCalledWith('/vendor-members/')
    expect(data).toEqual([{ id: 2 }])
  })

  it('invites vendor members', async () => {
    mockPost.mockResolvedValue({ data: { id: 9 } })
    const payload = { email: 'person@example.com' }
    const data = await inviteVendorMember(payload as any)
    expect(mockPost).toHaveBeenCalledWith('/vendor-members/', payload)
    expect(data).toEqual({ id: 9 })
  })

  it('updates vendor members', async () => {
    mockPatch.mockResolvedValue({ data: { id: 9, role: 'admin' } })
    const payload = { role: 'admin' }
    const data = await updateVendorMember(9, payload as any)
    expect(mockPatch).toHaveBeenCalledWith('/vendor-members/9/', payload)
    expect(data).toEqual({ id: 9, role: 'admin' })
  })

  it('lists vendor invites', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 11 }] })
    const data = await listVendorInvites()
    expect(mockGet).toHaveBeenCalledWith('/vendor-invites/')
    expect(data).toEqual([{ id: 11 }])
  })

  it('accepts vendor invites', async () => {
    mockPost.mockResolvedValue({ data: { id: 3 } })
    const data = await acceptVendorInvite(3)
    expect(mockPost).toHaveBeenCalledWith('/vendor-invites/3/accept/', {})
    expect(data).toEqual({ id: 3 })
  })

  it('declines vendor invites', async () => {
    mockPost.mockResolvedValue({ data: { id: 4 } })
    const data = await declineVendorInvite(4)
    expect(mockPost).toHaveBeenCalledWith('/vendor-invites/4/decline/', {})
    expect(data).toEqual({ id: 4 })
  })

  it('lists vendor stores', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 1, name: 'Flagship' }] })
    const data = await listVendorStores()
    expect(mockGet).toHaveBeenCalledWith('/vendor-stores/')
    expect(data).toEqual([{ id: 1, name: 'Flagship' }])
  })

  it('creates vendor stores', async () => {
    mockPost.mockResolvedValue({ data: { id: 5, name: 'New Store' } })
    const payload = { name: 'New Store' }
    const data = await createVendorStore(payload as any)
    expect(mockPost).toHaveBeenCalledWith('/vendor-stores/', payload)
    expect(data).toEqual({ id: 5, name: 'New Store' })
  })

  it('updates vendor stores', async () => {
    mockPatch.mockResolvedValue({ data: { id: 5, name: 'Updated Store' } })
    const payload = { name: 'Updated Store' }
    const data = await updateVendorStore(5, payload as any)
    expect(mockPatch).toHaveBeenCalledWith('/vendor-stores/5/', payload)
    expect(data).toEqual({ id: 5, name: 'Updated Store' })
  })

  it('selects a vendor store', async () => {
    mockPost.mockResolvedValue({ data: { id: 8 } })
    const data = await selectVendorStore(8)
    expect(mockPost).toHaveBeenCalledWith('/vendor-stores/select/', { store: 8 })
    expect(data).toEqual({ id: 8 })
  })

  it('lists store access records', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 8 }] })
    const data = await listStoreAccess()
    expect(mockGet).toHaveBeenCalledWith('/vendor-store-access/')
    expect(data).toEqual([{ id: 8 }])
  })

  it('assigns store access', async () => {
    mockPost.mockResolvedValue({ data: { id: 8 } })
    const payload = { store: 1, member: 2 }
    const data = await assignStoreAccess(payload as any)
    expect(mockPost).toHaveBeenCalledWith('/vendor-store-access/', payload)
    expect(data).toEqual({ id: 8 })
  })

  it('removes store access', async () => {
    mockDelete.mockResolvedValue({ data: null })
    await removeStoreAccess(8)
    expect(mockDelete).toHaveBeenCalledWith('/vendor-store-access/8/')
  })
})
