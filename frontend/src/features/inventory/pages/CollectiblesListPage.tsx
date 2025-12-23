import React, { useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import Page from '../../../shared/components/Page'
import CollectiblesList from '../components/CollectiblesList'
import InventoryFiltersForm from '../components/InventoryFiltersForm'
import InventoryDetailSidebar from '../components/InventoryDetailSidebar'
import type { InventoryFiltersInput } from '../schema/filtersSchema'
import type { Collectible } from '../../../shared/types'

const CollectiblesListPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<InventoryFiltersInput>({})
  const [selectedCollectible, setSelectedCollectible] = useState<Collectible | null>(null)

  return (
    <Page
      title="Inventory"
      dataCy="collectibles-page"
      actions={
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-transparent">
            <span className="text-gray-500">Store:</span>
            <select className="appearance-none bg-transparent pr-6 font-medium text-gray-900 focus:outline-none cursor-pointer">
              <option>Flagship Store (default)</option>
              <option>Secondary Store</option>
              <option>Warehouse</option>
              <option disabled>──────────</option>
              <option>All Vendor Inventory</option>
            </select>
            <ChevronDown className="absolute right-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <Button 
            className="bg-brand-primary hover:bg-brand-primary-dark"
            onClick={() => navigate('/inventory/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        <div className="space-y-6">
          <InventoryFiltersForm defaultFilters={filters} onChange={setFilters} />
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <CollectiblesList filters={filters} onSelect={setSelectedCollectible} />
          </div>
        </div>
        <aside className="hidden lg:block">
          <InventoryDetailSidebar 
            collectible={selectedCollectible} 
            onDelete={(c) => {
              // The CollectiblesList already has delete logic, 
              // but we could trigger it from here if we wanted to share state.
              // For now, we'll just let the list handle its own deletes,
              // or we could refactor to lift the delete state up.
              console.log('Delete requested for', c.name)
            }}
          />
        </aside>
      </div>
    </Page>
  )
}

export default CollectiblesListPage
