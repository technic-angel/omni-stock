import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteCollectible } from '../api/collectiblesApi'

export function useDeleteCollectible() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) => deleteCollectible(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['collectibles'] })
      queryClient.invalidateQueries({ queryKey: ['collectible', id] })
    },
  })
}
