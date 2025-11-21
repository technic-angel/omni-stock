import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createCollectible } from '../api/collectiblesApi'
import type { CollectibleInput } from '../schema/itemSchema'

export const useCreateCollectible = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CollectibleInput) => createCollectible(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectibles'] })
    },
  })
}
