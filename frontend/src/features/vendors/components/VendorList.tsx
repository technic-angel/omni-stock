import React from 'react'

import Card from '../../../shared/components/Card'
import useVendors from '../hooks/useVendors'

const VendorList = () => {
  const { data, isLoading, error } = useVendors()

  if (isLoading) return <div>Loading vendors…</div>
  if (error) return <div className="text-red-600">Failed to load vendors.</div>

  if (!data || data.length === 0) {
    return <div className="text-sm text-gray-600">No vendors found.</div>
  }

  return (
    <Card title="Vendors">
      <ul className="space-y-2">
        {data.map((vendor) => (
          <li key={vendor.id} className="rounded border p-3">
            <div className="font-medium">{vendor.name}</div>
            {vendor.description && <div className="text-sm text-gray-600">{vendor.description}</div>}
            {vendor.contact_info && <div className="text-xs text-gray-500 mt-1">{vendor.contact_info}</div>}
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default VendorList
