import React from 'react'

import Card from '../../../shared/components/Card'
import useVendors from '../hooks/useVendors'

const VendorStatsCard = () => {
  const { data, isLoading, error } = useVendors()

  if (isLoading) return <Card title="Vendor Stats">Loading…</Card>
  if (error)
    return (
      <Card title="Vendor Stats">
        <p className="text-sm text-red-600">Failed to load stats.</p>
      </Card>
    )

  const totalVendors = data?.length ?? 0
  const activeVendors = data?.filter((vendor) => vendor.is_active !== false).length ?? 0

  return (
    <Card title="Vendor Stats">
      <dl className="space-y-3">
        <div className="flex justify-between text-sm">
          <dt className="text-gray-500">Total Vendors</dt>
          <dd className="font-semibold">{totalVendors}</dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-gray-500">Active Vendors</dt>
          <dd className="font-semibold">{activeVendors}</dd>
        </div>
      </dl>
    </Card>
  )
}

export default VendorStatsCard
