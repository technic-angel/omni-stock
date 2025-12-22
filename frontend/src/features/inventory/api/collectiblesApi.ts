import { http } from '../../../shared/lib/http'
import type { Paginated, Collectible } from '../../../shared/types'

const CATALOG_ITEMS_ENDPOINT = '/catalog/items/'

export async function fetchCollectibles(params: Record<string, any> = {}) {
  const { data } = await http.get<Paginated<Collectible>>(CATALOG_ITEMS_ENDPOINT, { params })
  return data
}

export async function createCollectible(payload: Record<string, any>) {
  const { data } = await http.post<Collectible>(CATALOG_ITEMS_ENDPOINT, payload)
  return data
}

export async function fetchCollectible(id: number | string) {
  const { data } = await http.get<Collectible>(`${CATALOG_ITEMS_ENDPOINT}${id}/`)
  return data
}

export async function updateCollectible(id: number | string, payload: Record<string, any>) {
  const { data } = await http.patch<Collectible>(`${CATALOG_ITEMS_ENDPOINT}${id}/`, payload)
  return data
}

export async function deleteCollectible(id: number | string) {
  await http.delete(`${CATALOG_ITEMS_ENDPOINT}${id}/`)
}
