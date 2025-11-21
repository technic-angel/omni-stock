import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = loginSchema.extend({
  email: z.string().email('Valid email required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
