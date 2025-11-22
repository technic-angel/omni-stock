import React from 'react'

import Page from '../../../shared/components/Page'
import Card from '../../../shared/components/Card'
import { useDashboardSummary } from '../hooks/useDashboardSummary'

const DashboardPage = () => {
  const { data } = useDashboardSummary()

  const items = [
    { label: 'Total Items', value: data?.totalItems ?? 0 },
    { label: 'Total Vendors', value: data?.totalVendors ?? 0 },
    { label: 'Categories', value: data?.totalCategories ?? 0 },
  ]

  return (
    <Page
      title="Dashboard"
      subtitle="High-level metrics and quick actions will surface here."
      dataCy="dashboard-page"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label} title={item.label}>
            <div className="text-2xl font-semibold">{item.value}</div>
          </Card>
        ))}
      </div>
    </Page>
  )
}

export default DashboardPage
