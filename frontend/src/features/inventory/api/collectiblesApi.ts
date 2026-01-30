import { http } from '../../../shared/lib/http'
import type { Paginated, Collectible } from '../../../shared/types'

const CATALOG_ITEMS_ENDPOINT = '/catalog/items/'
const CATALOG_SETS_ENDPOINT = '/catalog/sets/'
const CATALOG_PRODUCTS_ENDPOINT = '/catalog/products/'

export interface CatalogSet {
  id: number
  name: string
  code: string
  release_date: string | null
  card_count: number
}

export interface CatalogProduct {
  id: number
  name: string
  type: string
  release_date: string | null
  set: CatalogSet | null
}

export async function fetchCatalogSets(params: { search?: string, limit?: number } = {}) {
  const { data } = await http.get<Paginated<CatalogSet>>(CATALOG_SETS_ENDPOINT, { params })
  return data
}

export async function fetchCatalogProducts(params: { search?: string, limit?: number } = {}) {
  const { data } = await http.get<Paginated<CatalogProduct>>(CATALOG_PRODUCTS_ENDPOINT, { params })
  return data
}

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
