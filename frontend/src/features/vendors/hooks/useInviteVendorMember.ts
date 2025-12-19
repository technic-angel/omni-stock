import { useMutation, useQueryClient } from '@tanstack/react-query'

import { inviteVendorMember, type VendorMemberPayload } from '../api/vendorsApi'

export const useInviteVendorMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: VendorMemberPayload) => inviteVendorMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-members'] })
    },
  })
}

export default useInviteVendorMember
