import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCollectibles } from '../hooks/useCollectibles'
import { useDeleteCollectible } from '../hooks/useDeleteCollectible'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import type { Collectible as CollectibleType } from '../../../shared/types'
import type { InventoryFiltersInput } from '../schema/filtersSchema'

type Props = {
  filters: InventoryFiltersInput
  onSelect?: (collectible: CollectibleType) => void
}

const CollectiblesList = ({ filters, onSelect }: Props) => {
  const navigate = useNavigate()
  const { data, isLoading, error } = useCollectibles(filters)
  const deleteMutation = useDeleteCollectible()
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CollectibleType | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleEdit = (event: React.MouseEvent, id: number) => {
    event.stopPropagation()
    navigate(`/inventory/${id}/edit`)
  }

  const handleDeleteRequest = (event: React.MouseEvent, collectible: CollectibleType) => {
    event.stopPropagation()
    setDeleteTarget(collectible)
    setDeleteError(null)
  }

  const confirmDialogDescription = useMemo(() => {
    if (!deleteTarget) return undefined
    return `This will permanently remove ${deleteTarget.name} from your inventory.`
  }, [deleteTarget])

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return
    }
    setPendingDeleteId(deleteTarget.id)
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (mutationError: any) {
      const detail =
        mutationError?.response?.data?.detail ?? mutationError?.message ?? 'Unable to delete item.'
      setDeleteError(detail)
    } finally {
      setPendingDeleteId(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteTarget(null)
    setDeleteError(null)
  }

  if (isLoading) return <div>Loading collectibles…</div>
  if (error) return <div>Error loading collectibles</div>

  if (!data || data.results.length === 0) {
    return <div className="text-sm text-gray-600">No collectibles match the current filters.</div>
  }

  return (
    <>
      {deleteError && (
        <div className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {deleteError}
        </div>
      )}
      <ul className="space-y-2" data-cy="collectible-list">
        {data.results.map((c: CollectibleType) => (
          <li
            key={c.id}
            className="rounded border p-3 hover:bg-gray-50 cursor-pointer"
            data-cy="collectible-row"
            onClick={() => onSelect?.(c)}
          >
            <div className="font-medium" data-cy="collectible-name">
              {c.name}
            </div>
            <div className="text-sm text-gray-600">
              {c.language} — {c.market_region}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                data-cy="collectible-edit"
                className="text-sm text-blue-600"
                type="button"
                onClick={(event) => handleEdit(event, c.id)}
              >
                Edit
              </button>
              <button
                data-cy="collectible-delete"
                className="text-sm text-red-600 disabled:opacity-50"
                type="button"
                disabled={pendingDeleteId === c.id}
                onClick={(event) => handleDeleteRequest(event, c)}
              >
                {pendingDeleteId === c.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete collectible"
        description={confirmDialogDescription}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isConfirming={pendingDeleteId === deleteTarget?.id}
        confirmButtonClassName="bg-red-600"
      />
    </>
  )
}

export default CollectiblesList
