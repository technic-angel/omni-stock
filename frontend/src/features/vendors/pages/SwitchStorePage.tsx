import { Link, useNavigate } from 'react-router-dom'
import { Store, CheckCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import Page from '@/shared/components/Page'
import { useVendorStores } from '../hooks/useVendorStores'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useSelectStore } from '../hooks/useSelectStore'

const SwitchStorePage = () => {
  const navigate = useNavigate()
  const { data: stores, isLoading, error } = useVendorStores()
  const { data: currentUser } = useCurrentUser()
  const activeStoreId = currentUser?.active_store?.id
  const { mutateAsync: selectStore, isPending } = useSelectStore()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredStores = useMemo(() => {
    if (!stores) return []
    return stores.filter((store) => store.name.toLowerCase() !== 'default store')
  }, [stores])

  const handleSelect = async (storeId: number) => {
    setFeedback(null)
    setErrorMessage(null)
    try {
      await selectStore(storeId)
      setFeedback('Store updated.')
      navigate(`/stores/${storeId}`)
    } catch (err) {
      console.error(err)
      setErrorMessage('Unable to switch stores right now. Please try again.')
    }
  }

  return (
    <Page
      title="Switch store"
      subtitle="Pick a different storefront inside this vendor."
      dataCy="switch-store-page"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/vendors">Back to vendor overview</Link>
          </Button>
          <Button asChild>
            <Link to="/stores/new">Create store</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {feedback && <p className="text-sm text-emerald-600">{feedback}</p>}
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading stores…</p>
        ) : error ? (
          <p className="text-sm text-red-600">Failed to load stores.</p>
        ) : filteredStores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
            No stores yet. Create one to start assigning inventory.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredStores.map((store) => {
              const isActive = store.id === activeStoreId
              return (
                <div
                  key={store.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="flex items-center gap-2 text-base font-semibold text-gray-900">
                      <Store className="h-4 w-4 text-indigo-500" />
                      {store.name}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {store.type ? `${store.type} • ` : ''}
                      {store.is_active ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="ghost">
                      <Link to={`/stores/${store.id}`}>Manage</Link>
                    </Button>
                    <Button
                      variant={isActive ? 'outline' : 'default'}
                      disabled={isActive || isPending}
                      onClick={() => handleSelect(store.id)}
                    >
                      {isActive ? 'Current store' : isPending ? 'Switching…' : 'Set as active'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Page>
  )
}

export default SwitchStorePage
