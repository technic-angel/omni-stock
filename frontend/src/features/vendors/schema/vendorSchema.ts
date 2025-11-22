import { z } from 'zod'

export const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  contact_info: z.string().optional(),
  is_active: z.boolean().optional(),
})

export type VendorInput = z.infer<typeof vendorSchema>
