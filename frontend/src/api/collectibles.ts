import { http } from './http'
import type { Paginated, Collectible } from '../types'

export async function fetchCollectibles(params: Record<string, any> = {}) {
  const { data } = await http.get<Paginated<Collectible>>('/collectibles/', { params })
  return data
}
