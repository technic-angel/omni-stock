import React from 'react'

import Page from '../../../shared/components/Page'
import VendorList from '../components/VendorList'

const VendorOverviewPage = () => {
  return (
    <Page
      title="Vendor Overview"
      subtitle="Manage vendor profile information and staff assignments."
      dataCy="vendor-page"
    >
      <VendorList />
    </Page>
  )
}

export default VendorOverviewPage
