import { z } from 'zod'

import type { StoreType } from '../api/vendorsApi'

export const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  type: z.custom<StoreType>().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  metadata: z.record(z.any()).optional().nullable(),
  logo_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal(''))
    .optional(),
  banner_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal(''))
    .optional(),
  currency: z.string().optional(),
  default_tax_rate: z.string().optional(),
  is_active: z.boolean().optional(),
})

export type StoreInput = z.infer<typeof storeSchema>
