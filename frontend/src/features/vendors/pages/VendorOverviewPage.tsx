import React from 'react'

import Page from '../../../shared/components/Page'
import VendorList from '../components/VendorList'
import VendorForm from '../components/VendorForm'

const VendorOverviewPage = () => {
  return (
    <Page
      title="Vendor Overview"
      subtitle="Manage vendor profile information and staff assignments."
      dataCy="vendor-page"
    >
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <VendorList />
        <VendorForm />
      </div>
    </Page>
  )
}

export default VendorOverviewPage
