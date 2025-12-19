import React from 'react'

import Page from '../../../shared/components/Page'
import VendorProfileCard from '../components/VendorProfileCard'
import VendorStatsCard from '../components/VendorStatsCard'
import StoreListCard from '../components/StoreListCard'

const VendorOverviewPage = () => {
  return (
    <Page
      title="Vendor Overview"
      subtitle="Manage vendor profile information and staff assignments."
      dataCy="vendor-page"
    >
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <VendorProfileCard />
          <VendorStatsCard />
        </div>
        <StoreListCard />
      </div>
    </Page>
  )
}

export default VendorOverviewPage
