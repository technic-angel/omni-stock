import React, { useState } from 'react'

import Page from '../../../shared/components/Page'
import CollectiblesList from '../components/CollectiblesList'
import CollectibleCreateForm from '../components/CollectibleCreateForm'
import InventoryFiltersForm from '../components/InventoryFiltersForm'
import type { InventoryFiltersInput } from '../schema/filtersSchema'

const CollectiblesListPage = () => {
  const [filters, setFilters] = useState<InventoryFiltersInput>({})

  return (
    <Page
      title="Collectibles"
      subtitle="View and manage the inventory currently in stock."
      dataCy="collectibles-page"
    >
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <InventoryFiltersForm defaultFilters={filters} onChange={setFilters} />
          <CollectiblesList filters={filters} />
        </div>
        <CollectibleCreateForm onCreated={() => setFilters((prev) => ({ ...prev }))} />
      </div>
    </Page>
  )
}

export default CollectiblesListPage
