import { useNavigate } from 'react-router-dom'

import Page from '../../../shared/components/Page'
import StoreForm from '../components/StoreForm'

const CreateStorePage = () => {
  const navigate = useNavigate()

  return (
    <Page
      title="Create your store"
      subtitle="Add a retail, online, or popup location so teammates can start managing inventory."
      dataCy="create-store-page"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">Store details</h2>
            <p className="text-sm text-gray-500">
              Give your store a clear name and description so teammates know where they’re working.
            </p>
          </div>

          <StoreForm onCreated={() => navigate('/vendors')} />
        </section>
      </div>
    </Page>
  )
}

export default CreateStorePage
