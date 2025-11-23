import { http } from '../../../shared/lib/http'
import type { Paginated, Collectible } from '../../../shared/types'

export async function fetchCollectibles(params: Record<string, any> = {}) {
  const { data } = await http.get<Paginated<Collectible>>('/collectibles/', { params })
  return data
}

export async function createCollectible(payload: Record<string, any>) {
  const { data } = await http.post<Collectible>('/collectibles/', payload)
  return data
}

export async function fetchCollectible(id: number | string) {
  const { data } = await http.get<Collectible>(`/collectibles/${id}/`)
  return data
}

export async function updateCollectible(id: number | string, payload: Record<string, any>) {
  const { data } = await http.patch<Collectible>(`/collectibles/${id}/`, payload)
  return data
}

export async function deleteCollectible(id: number | string) {
  await http.delete(`/collectibles/${id}/`)
}
