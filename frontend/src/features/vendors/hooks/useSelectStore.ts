import { useMutation, useQueryClient } from '@tanstack/react-query'

import { selectVendorStore } from '../api/vendorsApi'

export const useSelectStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storeId: number) => selectVendorStore(storeId),
    onSuccess: () => {
      const keys = [['currentUser'], ['vendor-stores'], ['vendor']]
      keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
    },
  })
}

export default useSelectStore
