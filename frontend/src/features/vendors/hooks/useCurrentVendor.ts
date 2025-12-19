import { useQuery } from '@tanstack/react-query'

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { fetchVendor } from '../api/vendorsApi'

export const useCurrentVendor = () => {
  const { data: currentUser } = useCurrentUser()
  const vendorId = currentUser?.active_vendor?.id

  return useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => fetchVendor(vendorId!),
    enabled: Boolean(vendorId),
    staleTime: 60_000,
  })
}

export default useCurrentVendor
