import React from 'react'

import Page from '../../../shared/components/Page'

const VendorOverviewPage = () => {
  return (
    <Page
      title="Vendor Overview"
      subtitle="Manage vendor profile information and staff assignments."
      dataCy="vendor-page"
    >
      <div className="text-sm text-gray-700">
        Vendor management UI will live here. The backend vendors domain is being migrated, and this placeholder keeps the
        frontend architecture aligned while services are implemented.
      </div>
    </Page>
  )
}

export default VendorOverviewPage
