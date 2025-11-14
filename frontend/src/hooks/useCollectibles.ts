import { useQuery } from '@tanstack/react-query'
import { fetchCollectibles } from '../api/collectibles'

export function useCollectibles(filters: Record<string, any>) {
  return useQuery({
    queryKey: ['collectibles', filters],
    queryFn: () => fetchCollectibles(filters),
    staleTime: 60_000,
    keepPreviousData: true
  })
}
