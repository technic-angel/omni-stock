import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateVendorMember } from '../api/vendorsApi'

type UpdateArgs = {
  id: number
  payload: Parameters<typeof updateVendorMember>[1]
}

export const useUpdateVendorMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateArgs) => updateVendorMember(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-members'] })
    },
  })
}

export default useUpdateVendorMember
