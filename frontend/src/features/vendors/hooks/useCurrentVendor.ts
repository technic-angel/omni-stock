import { useQuery } from '@tanstack/react-query'

import { fetchCurrentVendor } from '../api/vendorsApi'

export const useCurrentVendor = () => {
  return useQuery({
    queryKey: ['vendors', 'current'],
    queryFn: fetchCurrentVendor,
    staleTime: 60_000,
  })
}

export default useCurrentVendor
