import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateCollectible } from '../api/collectiblesApi'

export function useUpdateCollectible(id: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, any>) => updateCollectible(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectibles'] })
      queryClient.invalidateQueries({ queryKey: ['collectible', id] })
    },
  })
}
