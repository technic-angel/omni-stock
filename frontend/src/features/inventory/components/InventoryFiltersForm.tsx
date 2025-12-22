import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, Filter, X } from 'lucide-react'

import { InventoryFiltersInput, inventoryFiltersSchema } from '../schema/filtersSchema'
import { Button } from '@/components/ui/button'

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
    reset({
      search: '',
      category: '',
      status: '',
      language: '',
      market_region: '',
    })
    onChange({})
  }

  return (
    <form
      onSubmit={handleSubmit(onChange)}
      className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      data-cy="collectibles-filters"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
            placeholder="Search inventory..."
            {...register('search')}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
            {...register('category')}
          >
            <option value="">All Categories</option>
            <option value="pokemon_card">Pokémon Cards</option>
            <option value="sealed_product">Sealed Product</option>
          </select>

          <select
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
            {...register('language')}
          >
            <option value="">All Languages</option>
            <option value="English">English</option>
            <option value="Japanese">Japanese</option>
          </select>

          <select
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
            {...register('market_region')}
          >
            <option value="">All Regions</option>
            <option value="US">US</option>
            <option value="JP">JP</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <Button type="submit" size="sm" className="bg-brand-primary hover:bg-brand-primary-dark">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            {(isDirty || Object.values(defaultFilters).some(v => !!v)) && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}

export default InventoryFiltersForm
