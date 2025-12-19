import { useMutation, useQueryClient } from '@tanstack/react-query'

import { acceptVendorInvite } from '../api/vendorsApi'

export const useAcceptVendorInvite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => acceptVendorInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invites'] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendor'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}

export default useAcceptVendorInvite
