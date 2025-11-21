import { z } from 'zod'

export const inventoryFiltersSchema = z.object({
  language: z.string().optional(),
  market_region: z.string().optional(),
})

export type InventoryFiltersInput = z.infer<typeof inventoryFiltersSchema>
