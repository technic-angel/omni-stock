export interface CardDetails {
  id: number
  sku?: string | null
  external_ids?: Record<string, string>
}

export interface CatalogVariant {
  id: number
  condition?: string | null
  grade?: string | null
  quantity: number
  price_adjustment?: string | null
}

export interface Collectible {
  id: number
  name: string
  sku?: string
  quantity?: number
  language?: string
  market_region?: string
  image_url?: string | null
  card_details?: CardDetails | null
  variants?: CatalogVariant[]
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
