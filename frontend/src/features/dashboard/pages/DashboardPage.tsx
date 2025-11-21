import React from 'react'

import Page from '../../../shared/components/Page'

const DashboardPage = () => {
  return (
    <Page
      title="Dashboard"
      subtitle="High-level metrics and quick actions will surface here."
      dataCy="dashboard-page"
    >
      <div className="text-sm text-gray-700">
        KPI charts and summary widgets will be added once the backend exposes aggregated inventory data. For now, this
        placeholder keeps the feature architecture in place.
      </div>
    </Page>
  )
}

export default DashboardPage
