import React from 'react'

import Page from '../../../shared/components/Page'
import Card from '../../../shared/components/Card'
import { useInventoryOverview } from '../../inventory/hooks/useInventoryOverview'

const DashboardPage = () => {
  const { data, isLoading, error } = useInventoryOverview()

  const stats = data?.stats || {
    totalSkus: 0,
    totalUnits: 0,
    lowStock: 0,
    pendingTransfers: 0
  }

  const items = [
    { label: 'Total SKUs', value: isLoading ? '...' : stats.totalSkus },
    { label: 'Units On Hand', value: isLoading ? '...' : stats.totalUnits },
    { label: 'Low Stock Items', value: isLoading ? '...' : stats.lowStock },
  ]

  return (
    <Page
      title="Dashboard"
      subtitle="High-level metrics and quick actions for your inventory."
      dataCy="dashboard-page"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label} title={item.label}>
            <div className="text-3xl font-bold text-gray-900">{item.value}</div>
          </Card>
        ))}
      </div>

      {/* Store Breakdown Preview */}
      {data?.stores && data.stores.length > 0 && (
         <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Store Breakdown</h3>
            <div className="grid gap-4 md:grid-cols-2">
                {data.stores.map(store => (
                    <div key={store.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800">{store.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs ${store.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {store.status}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500">
                            <div>SKUs: {store.totalSkus}</div>
                            <div>Units: {store.unitsOnHand}</div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      )}
    </Page>
  )
}

export default DashboardPage
