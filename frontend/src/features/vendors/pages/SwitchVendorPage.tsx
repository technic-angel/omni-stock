import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import Page from '@/shared/components/Page'

const SwitchVendorPage = () => {
  return (
    <Page
      title="Switch vendor"
      subtitle="Choose which workspace you want to manage."
      dataCy="switch-vendor-page"
      actions={
        <Button asChild variant="outline">
          <Link to="/vendors">Back to overview</Link>
        </Button>
      }
    >
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm leading-relaxed text-gray-600 shadow-sm">
        <p className="font-medium text-gray-900">Coming soon</p>
        <p className="mt-2">
          This page will list every vendor you&apos;re a member of so you can quickly pick which workspace is active.
          For now, reach out to the OmniStock team or accept an invite from the sidebar to change vendors.
        </p>
      </div>
    </Page>
  )
}

export default SwitchVendorPage
