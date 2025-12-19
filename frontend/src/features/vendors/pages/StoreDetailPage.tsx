import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import Page from '../../../shared/components/Page'

const StoreDetailPage = () => {
  const { storeId } = useParams<{ storeId: string }>()

  return (
    <Page
      title="Store details"
      subtitle="Manage store profile, access, and settings."
      dataCy="store-detail-page"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/stores/switch">Switch store</Link>
          </Button>
          <Button asChild>
            <Link to="/stores/new">New store</Link>
          </Button>
        </div>
      }
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Store ID: {storeId}</p>
        <p className="mt-2 text-gray-700">Detailed store information will appear here.</p>
      </div>
    </Page>
  )
}

export default StoreDetailPage
