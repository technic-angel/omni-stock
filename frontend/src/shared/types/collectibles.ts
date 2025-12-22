export interface CardDetails {
  id?: number
  sku?: string | null
  external_ids?: Record<string, string>
  language?: string
  market_region?: string
  psa_grade?: string
  condition?: string
  last_estimated_at?: string
  release_date?: string
  print_run?: string
  notes?: string
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
  category?: string
  image_url?: string | null
  card_details?: CardDetails | null
  variants?: CatalogVariant[]
  created_at?: string
  updated_at?: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
