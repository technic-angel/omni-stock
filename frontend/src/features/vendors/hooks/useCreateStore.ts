import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createVendorStore } from '../api/vendorsApi'
import type { StoreInput } from '../schema/storeSchema'

export const useCreateStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StoreInput) => createVendorStore(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-stores'] })
      queryClient.invalidateQueries({ queryKey: ['vendor'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}

export default useCreateStore
