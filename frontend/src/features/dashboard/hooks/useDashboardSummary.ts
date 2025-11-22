import { useQuery } from '@tanstack/react-query'

import { fetchDashboardSummary } from '../api/summaryApi'

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 60_000,
  })
}

export default useDashboardSummary
