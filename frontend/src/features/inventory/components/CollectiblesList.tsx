import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit2, Trash2 } from 'lucide-react'

import { useCollectibles } from '../hooks/useCollectibles'
import { useDeleteCollectible } from '../hooks/useDeleteCollectible'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import type { Collectible as CollectibleType } from '../../../shared/types'
import type { InventoryFiltersInput } from '../schema/filtersSchema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'

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
  const collectibles = Array.isArray(data) ? data : data?.results ?? []

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
    } catch (mutationError) {
      const error = mutationError as { response?: { data?: { detail?: string } }; message?: string }
      const detail = error?.response?.data?.detail ?? error?.message ?? 'Unable to delete item.'
      setDeleteError(detail)
    } finally {
      setPendingDeleteId(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteTarget(null)
    setDeleteError(null)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading collectibles…</div>
  if (error) return <div className="p-8 text-center text-red-500">Error loading collectibles</div>

  if (collectibles.length === 0) {
    return <div className="p-8 text-center text-gray-500">No collectibles match the current filters.</div>
  }

  return (
    <>
      {deleteError && (
        <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Qty/Grade</TableHead>
            <TableHead>Market Region</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collectibles.map((c: CollectibleType) => (
            <TableRow 
              key={c.id} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect?.(c)}
            >
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{c.name}</span>
                  {c.sku && <span className="text-xs text-gray-500 font-normal">{c.sku}</span>}
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-brand-primary-soft px-2.5 py-0.5 text-xs font-medium text-brand-primary capitalize">
                  {c.category || 'Collectible'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{c.quantity || 0}x</span>
                  {c.card_details?.psa_grade && (
                    <span className="text-xs text-gray-500">PSA {c.card_details.psa_grade}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{c.card_details?.market_region || '-'}</TableCell>
              <TableCell>{c.card_details?.language || '-'}</TableCell>
              <TableCell className="text-gray-500">
                {formatDate(c.updated_at)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary-soft"
                    onClick={(e) => handleEdit(e as any, c.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => handleDeleteRequest(e as any, c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Item"
        description={confirmDialogDescription}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={pendingDeleteId !== null}
        variant="destructive"
      />
    </>
  )
}

export default CollectiblesList
