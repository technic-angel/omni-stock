import { useMutation, useQueryClient } from '@tanstack/react-query'

import { selectVendorMembership } from '../api/vendorsApi'

export const useSelectVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vendorId: number) => selectVendorMembership(vendorId),
    onSuccess: () => {
      const keys = [
        ['currentUser'],
        ['vendors'],
        ['vendor'],
        ['vendor-stores'],
        ['vendor-members'],
        ['vendor-invites'],
      ]
      keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
    },
  })
}

export default useSelectVendor
