import { z } from 'zod'

export const dashboardSummarySchema = z.object({
  totalItems: z.number().int().nonnegative().default(0),
  totalVendors: z.number().int().nonnegative().default(0),
  totalCategories: z.number().int().nonnegative().default(0),
})

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>
