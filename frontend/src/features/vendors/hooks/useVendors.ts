import { useQuery } from '@tanstack/react-query'

import { fetchVendors } from '../api/vendorsApi'

export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    staleTime: 60_000,
  })
}

export default useVendors
