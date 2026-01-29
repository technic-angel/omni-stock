import { useQuery } from '@tanstack/react-query'
import { fetchCatalogSets, type CatalogSet } from '../api/collectiblesApi'

export const useCatalogSets = (search?: string) => {
  return useQuery({
    queryKey: ['catalog-sets', search],
    queryFn: () => fetchCatalogSets({ search }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
