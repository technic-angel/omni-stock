import React from 'react'

const PokemonFields = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Set Name</label>
        <input
          type="text"
          placeholder="e.g. Shining Fates"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Card Number</label>
        <input
          type="text"
          placeholder="e.g. SV107/SV122"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Rarity</label>
        <select className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20">
          <option>Common</option>
          <option>Uncommon</option>
          <option>Rare</option>
          <option>Ultra Rare</option>
          <option>Secret Rare</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Finish</label>
        <select className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20">
          <option>Non-Holo</option>
          <option>Holo</option>
          <option>Reverse Holo</option>
          <option>Full Art</option>
        </select>
      </div>
    </div>
  )
}

export default PokemonFields
