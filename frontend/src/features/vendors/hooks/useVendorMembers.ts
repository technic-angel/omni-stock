import { useQuery } from '@tanstack/react-query'

import { listVendorMembers } from '../api/vendorsApi'

export const useVendorMembers = () =>
  useQuery({
    queryKey: ['vendor-members'],
    queryFn: listVendorMembers,
    staleTime: 60_000,
  })

export default useVendorMembers
