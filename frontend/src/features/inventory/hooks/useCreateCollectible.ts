import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createCollectible } from '../api/collectiblesApi'
export const useCreateCollectible = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, any>) => createCollectible(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectibles'] })
    },
  })
}
