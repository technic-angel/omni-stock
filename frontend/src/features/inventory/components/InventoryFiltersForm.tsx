import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { InventoryFiltersInput, inventoryFiltersSchema } from '../schema/filtersSchema'

type Props = {
  defaultFilters: InventoryFiltersInput
  onChange: (filters: InventoryFiltersInput) => void
}

const InventoryFiltersForm = ({ defaultFilters, onChange }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<InventoryFiltersInput>({
    resolver: zodResolver(inventoryFiltersSchema),
    defaultValues: defaultFilters,
  })

  const handleReset = () => {
    reset({})
    onChange({})
  }

  return (
    <form
      onSubmit={handleSubmit(onChange)}
      className="flex flex-wrap gap-3 rounded border border-gray-200 bg-white p-3"
      data-cy="collectibles-filters"
    >
      <label className="flex flex-col text-sm">
        Language
        <input className="rounded border p-2" placeholder="e.g. English" {...register('language')} />
      </label>
      <label className="flex flex-col text-sm">
        Market Region
        <input className="rounded border p-2" placeholder="e.g. US" {...register('market_region')} />
      </label>
      <div className="flex items-end gap-2">
        <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">
          Apply
        </button>
        <button
          className="rounded border border-gray-300 px-4 py-2 text-sm"
          type="button"
          onClick={handleReset}
          disabled={!isDirty && !defaultFilters.language && !defaultFilters.market_region}
        >
          Reset
        </button>
      </div>
    </form>
  )
}

export default InventoryFiltersForm
