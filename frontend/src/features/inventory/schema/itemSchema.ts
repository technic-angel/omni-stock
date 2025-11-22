import { z } from 'zod'

export const collectibleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(0, 'Quantity must be at least 0'),
  language: z.string().optional(),
  market_region: z.string().optional(),
  image_url: z.string().url().optional(),
  image_file: z
    .any()
    .optional()
    .transform((value) => {
      if (!value) return undefined
      if (value instanceof File) return value
      if (Array.isArray(value) && value[0] instanceof File) return value[0]
      if (value?.length && value[0] instanceof File) return value[0]
      return undefined
    }),
})

export type CollectibleInput = z.infer<typeof collectibleSchema>
