import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Building2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import Page from '@/shared/components/Page'
import { useVendors } from '../hooks/useVendors'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useSelectVendor } from '../hooks/useSelectVendor'

const SwitchVendorPage = () => {
  const navigate = useNavigate()
  const { data: vendors, isLoading, error } = useVendors()
  const { data: currentUser } = useCurrentUser()
  const activeVendorId = currentUser?.active_vendor?.id
  const { mutateAsync: selectVendor, isPending } = useSelectVendor()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sortedVendors = useMemo(() => {
    return [...(vendors ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  }, [vendors])

  const handleSelect = async (vendorId: number) => {
    setFeedback(null)
    setErrorMessage(null)
    try {
      await selectVendor(vendorId)
      setFeedback('Vendor updated.')
      navigate('/vendors')
    } catch (err) {
      console.error(err)
      setErrorMessage('Unable to switch vendors right now. Please try again.')
    }
  }

  return (
    <Page
      title="Switch vendor"
      subtitle="Choose which workspace you want to manage."
      dataCy="switch-vendor-page"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/vendors">Back to overview</Link>
          </Button>
          <Button asChild>
            <Link to="/vendors/new">Create vendor</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {feedback && <p className="text-sm text-emerald-600">{feedback}</p>}
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading your vendors…</p>
        ) : error ? (
          <p className="text-sm text-red-600">Failed to load vendors.</p>
        ) : sortedVendors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
            You are not linked to any vendors yet. Create one to get started.
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedVendors.map((vendor) => {
              const isActive = vendor.id === activeVendorId
              return (
                <div
                  key={vendor.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="flex items-center gap-2 text-base font-semibold text-gray-900">
                      <Building2 className="h-4 w-4 text-brand-primary" />
                      {vendor.name}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </p>
                    {vendor.description && <p className="mt-1 text-sm text-gray-600">{vendor.description}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="ghost">
                      <Link to="/vendors">View</Link>
                    </Button>
                    <Button
                      variant={isActive ? 'outline' : 'default'}
                      disabled={isActive || isPending}
                      onClick={() => handleSelect(vendor.id)}
                    >
                      {isActive ? 'Current vendor' : isPending ? 'Switching…' : 'Set as active'}
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

export default SwitchVendorPage
