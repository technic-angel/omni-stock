import { z } from 'zod'

export const updateCollectibleSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.number().int().min(0),
  language: z.string().optional(),
  market_region: z.string().optional(),
})

export type UpdateCollectibleInput = z.infer<typeof updateCollectibleSchema>
