import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import Page from '../../../shared/components/Page'
import { useVendorStores } from '../hooks/useVendorStores'

const StoreDetailPage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const numericStoreId = Number(storeId)
  const { data: stores, isLoading, error } = useVendorStores()
  const store = stores?.find((s) => s.id === numericStoreId)

  const renderBody = () => {
    if (isLoading) {
      return <p className="text-sm text-gray-500">Loading store details…</p>
    }
    if (error) {
      return <p className="text-sm text-red-600">Failed to load store data.</p>
    }
    if (!store) {
      return <p className="text-sm text-gray-500">Store not found or you no longer have access.</p>
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Name</p>
            <p className="text-lg font-semibold text-gray-900">{store.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
            <p className="text-lg font-semibold text-gray-900">
              {store.is_active ? 'Active' : 'Inactive'} {store.type ? `• ${store.type}` : ''}
            </p>
          </div>
        </div>

        {store.description && (
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Description</p>
            <p className="mt-1 text-sm text-gray-700">{store.description}</p>
          </div>
        )}

        {store.address && (
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Address</p>
            <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{store.address}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Currency</p>
            <p className="mt-1 text-sm text-gray-700">{store.currency ?? 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Default tax rate</p>
            <p className="mt-1 text-sm text-gray-700">
              {store.default_tax_rate ? `${store.default_tax_rate}%` : 'Not set'}
            </p>
          </div>
        </div>

        {store.metadata && Object.keys(store.metadata).length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Metadata</p>
            <pre className="mt-1 overflow-x-auto rounded border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700">
              {JSON.stringify(store.metadata, null, 2)}
            </pre>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Created</p>
            <p className="mt-1 text-sm text-gray-700">{new Date(store.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Updated</p>
            <p className="mt-1 text-sm text-gray-700">{new Date(store.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Page
      title="Store details"
      subtitle="Manage store profile, access, and settings."
      dataCy="store-detail-page"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/stores/switch">Switch store</Link>
          </Button>
          <Button asChild>
            <Link to="/stores/new">New store</Link>
          </Button>
        </div>
      }
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">{renderBody()}</div>
    </Page>
  )
}

export default StoreDetailPage
