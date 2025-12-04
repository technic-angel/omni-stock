import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Page from '../../../shared/components/Page'
import CollectibleEditForm from '../components/CollectibleEditForm'
import { useCollectible } from '../hooks/useCollectible'

const CollectibleEditPage = () => {
  const { collectibleId } = useParams<{ collectibleId: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useCollectible(collectibleId)

  if (!collectibleId) {
    return (
      <Page title="Collectibles">
        <div>Collectible not found.</div>
      </Page>
    )
  }

  if (isLoading) {
    return (
      <Page title="Collectibles">
        <div>Loading collectible…</div>
      </Page>
    )
  }

  if (error || !data) {
    return (
      <Page title="Collectibles">
        <div>Error loading collectible.</div>
      </Page>
    )
  }

  return (
    <Page
      title={`Edit ${data.name}`}
      subtitle="Update inventory details and image."
      dataCy="collectible-edit-page"
    >
      <CollectibleEditForm collectible={data} onSuccess={() => navigate('/inventory')} />
    </Page>
  )
}

export default CollectibleEditPage
