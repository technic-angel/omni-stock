import { useQuery } from '@tanstack/react-query'
import { fetchCatalogProducts } from '../api/collectiblesApi'

export const useCatalogProducts = (search?: string) => {
  return useQuery({
    queryKey: ['catalog-products', search],
    queryFn: () => fetchCatalogProducts({ search }),
    staleTime: 5 * 60 * 1000,
  })
}
