export interface CardDetails {
  id: number
  sku?: string | null
  external_ids?: Record<string, string>
}

export interface Collectible {
  id: number
  name: string
  language?: string
  market_region?: string
  image_url?: string | null
  card_details?: CardDetails | null
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
