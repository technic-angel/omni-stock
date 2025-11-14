import React from 'react'
import { useCollectibles } from '../../hooks/useCollectibles'
import type { Collectible as CollectibleType } from '../../types'

export default function CollectiblesList({} : {}) {
  const { data, isLoading, error } = useCollectibles({})

  if (isLoading) return <div>Loading collectibles…</div>
  if (error) return <div>Error loading collectibles</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Collectibles</h2>
      {data && data.results.length === 0 && <div>No collectibles found</div>}
      <ul className="space-y-2">
        {data?.results.map((c: CollectibleType) => (
          <li key={c.id} className="p-2 border rounded">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-gray-600">{c.language} — {c.market_region}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
