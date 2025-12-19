import { useQuery } from '@tanstack/react-query'

import { listVendorInvites } from '../api/vendorsApi'

export const useVendorInvites = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['vendor-invites'],
    queryFn: listVendorInvites,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  })

export default useVendorInvites
