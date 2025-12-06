import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  fetchCollectibles,
  createCollectible,
  fetchCollectible,
  updateCollectible,
  deleteCollectible,
} from './collectiblesApi'
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

describe('collectiblesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchCollectibles passes params through to the API client', async () => {
    const payload = { results: [] }
    mockGet.mockResolvedValue({ data: payload })

    const data = await fetchCollectibles({ page: 2 })

    expect(mockGet).toHaveBeenCalledWith('/collectibles/', { params: { page: 2 } })
    expect(data).toBe(payload)
  })

  it('creates a new collectible', async () => {
    const payload = { name: 'Test' }
    mockPost.mockResolvedValue({ data: { id: 1 } })

    const data = await createCollectible(payload)

    expect(mockPost).toHaveBeenCalledWith('/collectibles/', payload)
    expect(data).toEqual({ id: 1 })
  })

  it('fetches a single collectible', async () => {
    mockGet.mockResolvedValue({ data: { id: 5 } })

    const data = await fetchCollectible(5)

    expect(mockGet).toHaveBeenCalledWith('/collectibles/5/')
    expect(data).toEqual({ id: 5 })
  })

  it('updates a collectible', async () => {
    mockPatch.mockResolvedValue({ data: { id: 3 } })

    const data = await updateCollectible(3, { name: 'Updated' })

    expect(mockPatch).toHaveBeenCalledWith('/collectibles/3/', { name: 'Updated' })
    expect(data).toEqual({ id: 3 })
  })

  it('deletes a collectible', async () => {
    mockDelete.mockResolvedValue({})

    await deleteCollectible(9)

    expect(mockDelete).toHaveBeenCalledWith('/collectibles/9/')
  })
})
