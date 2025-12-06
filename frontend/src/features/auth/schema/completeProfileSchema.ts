import { z } from 'zod'

export const completeProfileSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(5, 'Username must be at least 5 characters')
    .max(30, 'Username must be less than 30 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  birthdate: z.string().min(1, 'Birthdate is required'),
  company_name: z.string().optional(),
})

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>
