import { z } from 'zod'

const variantInputSchema = z.object({
  condition: z.string().optional(),
  grade: z.string().optional(),
  quantity: z
    .number({ invalid_type_error: 'Variant quantity must be a number' })
    .int('Variant quantity must be an integer')
    .min(0, 'Variant quantity must be at least 0'),
  price_adjustment: z.string().optional(),
})

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
  variants: z.array(variantInputSchema).default([]),
})

export type VariantInput = z.infer<typeof variantInputSchema>

export type VariantPayload = {
  condition?: string
  grade?: string
  quantity: number
  price_adjustment?: string
}

export const buildVariantPayloads = (
  variants?: VariantInput[],
): VariantPayload[] | undefined => {
  if (!variants) {
    return undefined
  }

  const sanitized = variants
    .map((variant) => {
      const condition = variant.condition?.trim()
      const grade = variant.grade?.trim()
      const quantity = typeof variant.quantity === 'number' ? variant.quantity : 0
      const priceAdjustmentValue = variant.price_adjustment?.toString().trim()

      const payload: VariantPayload = { quantity }
      if (condition) payload.condition = condition
      if (grade) payload.grade = grade
      if (priceAdjustmentValue) payload.price_adjustment = priceAdjustmentValue
      return payload
    })
    .filter(
      (variant) =>
        variant.quantity > 0 ||
        typeof variant.condition === 'string' ||
        typeof variant.grade === 'string' ||
        typeof variant.price_adjustment === 'string',
    )

  return sanitized.length ? sanitized : undefined
}

export type CollectibleInput = z.infer<typeof collectibleSchema>
