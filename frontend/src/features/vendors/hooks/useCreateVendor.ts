import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createVendor } from '../api/vendorsApi'
import type { VendorInput } from '../schema/vendorSchema'

export const useCreateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: VendorInput) => createVendor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendor'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}

export default useCreateVendor
