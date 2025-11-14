import React from 'react'
import CollectiblesList from './features/collectibles/CollectiblesList'

export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Omni-Stock (Frontend)</h1>
      <p className="mt-4">Welcome — frontend scaffolded. Next: collectibles list and auth.</p>
      <div className="mt-6">
        <CollectiblesList />
      </div>
    </div>
  )
}
