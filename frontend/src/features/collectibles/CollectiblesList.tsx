import React from 'react'
import { useCollectibles } from '../../hooks/useCollectibles'
import type { Collectible as CollectibleType } from '../../types'

export default function CollectiblesList({} : {}) {
  const { data, isLoading, error } = useCollectibles({})

  if (isLoading) return <div>Loading collectibles…</div>
  if (error) return <div>Error loading collectibles</div>

  return (
    <div className="p-4" data-cy="collectibles-page">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold mb-4">Collectibles</h2>
        <button data-cy="create-collectible-button" className="text-sm text-blue-600">Create</button>
      </div>

      {data && data.results.length === 0 && <div>No collectibles found</div>}
      <ul className="space-y-2" data-cy="collectible-list">
        {data?.results.map((c: CollectibleType) => (
          <li key={c.id} className="p-2 border rounded" data-cy="collectible-row">
            <div className="font-medium" data-cy="collectible-name">{c.name}</div>
            <div className="text-sm text-gray-600">{c.language} — {c.market_region}</div>
            <div className="mt-2">
              <button data-cy="collectible-edit" className="text-sm text-blue-600 mr-2">Edit</button>
              <button data-cy="collectible-delete" className="text-sm text-red-600">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
