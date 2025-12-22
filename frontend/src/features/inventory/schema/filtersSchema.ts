import { z } from 'zod'

export const inventoryFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  language: z.string().optional(),
  market_region: z.string().optional(),
})

export type InventoryFiltersInput = z.infer<typeof inventoryFiltersSchema>
