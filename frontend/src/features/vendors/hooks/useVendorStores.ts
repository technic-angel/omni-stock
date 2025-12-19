import { useQuery } from '@tanstack/react-query'
import { listVendorStores } from '../api/vendorsApi'

export const useVendorStores = () =>
  useQuery({
    queryKey: ['vendor-stores'],
    queryFn: listVendorStores,
    staleTime: 60_000, // 1 minute
  })

export default useVendorStores
