import React from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import Page from '../../../shared/components/Page'
import VendorProfileCard from '../components/VendorProfileCard'
import VendorStatsCard from '../components/VendorStatsCard'
import StoreListCard from '../components/StoreListCard'
import VendorMembersCard from '../components/VendorMembersCard'

const VendorOverviewPage = () => {
  return (
    <Page
      title="Vendor Overview"
      subtitle="Manage vendor profile information and staff assignments."
      dataCy="vendor-page"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/vendors/switch">Switch vendor</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/stores/new">New store</Link>
          </Button>
          <Button asChild>
            <Link to="/vendors/new">New vendor</Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <VendorProfileCard />
          <VendorStatsCard />
        </div>
        <StoreListCard />
        <VendorMembersCard />
      </div>
    </Page>
  )
}

export default VendorOverviewPage
