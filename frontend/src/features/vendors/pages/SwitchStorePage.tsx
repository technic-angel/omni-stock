import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import Page from '@/shared/components/Page'

const SwitchStorePage = () => {
  return (
    <Page
      title="Switch store"
      subtitle="Pick a different storefront inside this vendor."
      dataCy="switch-store-page"
      actions={
        <Button asChild variant="outline">
          <Link to="/vendors">Back to vendor overview</Link>
        </Button>
      }
    >
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm leading-relaxed text-gray-600 shadow-sm">
        <p className="font-medium text-gray-900">Store picker coming soon</p>
        <p className="mt-2">
          We&apos;ll render every store you have access to and let you promote one to the active context. Until then,
          use the store links in the vendor overview page to jump between storefronts or create a new store.
        </p>
      </div>
    </Page>
  )
}

export default SwitchStorePage
