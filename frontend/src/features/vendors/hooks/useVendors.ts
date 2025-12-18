// frontend/src/features/vendors/hooks/useVendors.ts
import { useQuery } from '@tanstack/react-query'
import { fetchVendors } from '../api/vendorsApi'

export const useVendors = () =>
  useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    staleTime: 60_000,
  })

export default useVendors
