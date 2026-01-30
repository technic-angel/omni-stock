import React, { useState } from 'react'
import { useCatalogSets } from '../../hooks/useCatalogSets'

export type PokemonFieldValues = {
  set_name?: string
  card_number?: string
  rarity?: string
  finish?: string
}

type PokemonFieldsProps = {
  values: PokemonFieldValues
  onChange: (updates: PokemonFieldValues) => void
}

const PokemonFields: React.FC<PokemonFieldsProps> = ({ values, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: setsPage } = useCatalogSets(searchTerm)
  const sets = setsPage?.results || []

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="pokemon-set-name">
          Set Name
        </label>
        <div className="relative">
          <input
            id="pokemon-set-name"
            type="text"
            list="sets-list"
            placeholder="e.g. Shining Fates"
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            value={values.set_name ?? ''}
            onChange={(e) => {
              const val = e.target.value
              onChange({ set_name: val })
              setSearchTerm(val)
            }}
          />
          <datalist id="sets-list">
            {sets.map((set) => (
              <option key={set.id} value={set.name}>
                {set.code ? `${set.name} (${set.code})` : set.name}
              </option>
            ))}
          </datalist>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="pokemon-card-number">
          Card Number
        </label>
        <input
          id="pokemon-card-number"
          type="text"
          placeholder="e.g. SV107/SV122"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.card_number ?? ''}
          onChange={(e) => onChange({ card_number: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="pokemon-rarity">
          Rarity
        </label>
        <select
          id="pokemon-rarity"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.rarity ?? ''}
          onChange={(e) => onChange({ rarity: e.target.value })}
        >
          <option value="">Select...</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="ultra_rare">Ultra Rare</option>
          <option value="secret_rare">Secret Rare</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="pokemon-finish">
          Finish
        </label>
        <select
          id="pokemon-finish"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.finish ?? ''}
          onChange={(e) => onChange({ finish: e.target.value })}
        >
          <option value="">Select...</option>
          <option value="non_holo">Non-Holo</option>
          <option value="holo">Holo</option>
          <option value="reverse_holo">Reverse Holo</option>
          <option value="full_art">Full Art</option>
        </select>
      </div>
    </div>
  )
}

export default PokemonFields
