import React, { useMemo } from 'react'

import Card from '../../../shared/components/Card'
import { useCurrentVendor } from '../hooks/useCurrentVendor'

const renderMetadata = (JSONObject: Record<string, any>) => {
  const entries = Object.entries(JSONObject)
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">No metadata</p>
  }
  return (
    <dl className="space-y-1 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-3">
          <dt className="text-gray-500">{key}</dt>
          <dd className="text-gray-900 text-right">{String(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

const VendorProfileCard = () => {
  const { data, isLoading, error } = useCurrentVendor()

  const contactInfo = useMemo(() => {
    if (!data?.contact_info) return null
    try {
      return JSON.parse(data.contact_info)
    } catch {
      return data.contact_info
    }
  }, [data])

  if (isLoading) return <div>Loading vendor…</div>
  if (error)
    return (
      <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Failed to load vendor profile.
      </div>
    )

  if (!data) {
    return (
      <Card title="Vendor Profile">
        <p className="text-sm text-gray-500">No vendor profile found.</p>
      </Card>
    )
  }

  return (
    <Card title="Vendor Profile" dataCy="vendor-profile-card">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{data.name}</h2>
          {data.description && <p className="text-gray-600 mt-1">{data.description}</p>}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Contact Info
          </h3>
          {typeof contactInfo === 'string' ? (
            <p className="text-sm text-gray-900">{contactInfo}</p>
          ) : contactInfo ? (
            renderMetadata(contactInfo)
          ) : (
            <p className="text-sm text-gray-500">No contact information</p>
          )}
        </div>
        <div className="text-xs text-gray-500">
          <p>Created: {data.created_at ? new Date(data.created_at).toLocaleString() : '—'}</p>
          <p>Updated: {data.updated_at ? new Date(data.updated_at).toLocaleString() : '—'}</p>
        </div>
      </div>
    </Card>
  )
}

export default VendorProfileCard
