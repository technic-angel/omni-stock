import React from 'react'

import { useCollectibles } from '../hooks/useCollectibles'
import type { Collectible as CollectibleType } from '../../../shared/types'
import type { InventoryFiltersInput } from '../schema/filtersSchema'

type Props = {
  filters: InventoryFiltersInput
}

const CollectiblesList = ({ filters }: Props) => {
  const { data, isLoading, error } = useCollectibles(filters)

  if (isLoading) return <div>Loading collectibles…</div>
  if (error) return <div>Error loading collectibles</div>

  if (!data || data.results.length === 0) {
    return <div className="text-sm text-gray-600">No collectibles match the current filters.</div>
  }

  return (
    <ul className="space-y-2" data-cy="collectible-list">
      {data.results.map((c: CollectibleType) => (
        <li key={c.id} className="rounded border p-3" data-cy="collectible-row">
          <div className="font-medium" data-cy="collectible-name">{c.name}</div>
          <div className="text-sm text-gray-600">{c.language} — {c.market_region}</div>
          <div className="mt-2 flex gap-2">
            <button data-cy="collectible-edit" className="text-sm text-blue-600">Edit</button>
            <button data-cy="collectible-delete" className="text-sm text-red-600">Delete</button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default CollectiblesList
