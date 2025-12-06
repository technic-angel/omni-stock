import { describe, it, expect, vi, beforeEach } from 'vitest'

import { fetchVendors, fetchCurrentVendor, createVendor } from './vendorsApi'
import { http } from '../../../shared/lib/http'

vi.mock('../../../shared/lib/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockGet = vi.mocked(http.get)
const mockPost = vi.mocked(http.post)

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

  it('fetches current vendor', async () => {
    mockGet.mockResolvedValue({ data: { id: 5 } })
    const data = await fetchCurrentVendor()
    expect(mockGet).toHaveBeenCalledWith('/vendors/me/')
    expect(data).toEqual({ id: 5 })
  })

  it('creates a new vendor', async () => {
    mockPost.mockResolvedValue({ data: { id: 7 } })
    const payload = { name: 'Vendor' }
    const data = await createVendor(payload)
    expect(mockPost).toHaveBeenCalledWith('/vendors/', payload)
    expect(data).toEqual({ id: 7 })
  })
})
