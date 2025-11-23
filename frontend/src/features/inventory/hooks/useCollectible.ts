import { useQuery } from '@tanstack/react-query'

import { fetchCollectible } from '../api/collectiblesApi'

export function useCollectible(id?: number | string) {
  return useQuery({
    queryKey: ['collectible', id],
    queryFn: () => {
      if (!id) {
        throw new Error('Collectible id is required')
      }
      return fetchCollectible(id)
    },
    enabled: Boolean(id),
  })
}
