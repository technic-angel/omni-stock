import React from 'react'
import { Edit, Trash2, ShoppingBasket, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { Collectible } from '@/shared/types'

type Props = {
  collectible: Collectible | null
  onDelete?: (collectible: Collectible) => void
}

const InventoryDetailSidebar = ({ collectible, onDelete }: Props) => {
  const navigate = useNavigate()

  if (!collectible) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
        <p>Select an item to view details</p>
      </div>
    )
  }

  const handleEdit = () => {
    navigate(`/inventory/${collectible.id}/edit`)
  }

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{collectible.name}</h3>
          {collectible.sku && <p className="text-sm text-gray-500">{collectible.sku}</p>}
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5 text-gray-400" />
        </Button>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary-soft px-3 py-1 text-xs font-medium text-brand-primary">
        <span className="h-2 w-2 rounded-full bg-brand-primary" />
        In Stock: Flagship Store • Active
      </div>

      <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
        {collectible.image_url ? (
          <img
            src={collectible.image_url}
            alt={collectible.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Info</h4>
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div className="text-gray-500">Type:</div>
          <div className="font-medium text-gray-900 capitalize">{collectible.category || 'Collectible'}</div>

          <div className="text-gray-500">Market Region:</div>
          <div className="font-medium text-gray-900">{collectible.card_details?.market_region || '-'}</div>

          <div className="text-gray-500">Language:</div>
          <div className="font-medium text-gray-900">{collectible.card_details?.language || '-'}</div>

          <div className="text-gray-500">Quantity:</div>
          <div className="font-medium text-gray-900">{collectible.quantity || 0}</div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Variants</h4>
        </div>
        {collectible.variants && collectible.variants.length > 0 ? (
          <div className="space-y-2">
            {collectible.variants.map((v, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                <span className="text-gray-600">{v.condition || 'Raw'} {v.grade ? `(PSA ${v.grade})` : ''}</span>
                <span className="font-medium">{v.quantity}x</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No variants added for graded/raw breakdowns</p>
        )}
        <Button variant="outline" size="sm" className="w-full text-xs border-brand-primary text-brand-primary hover:bg-brand-primary-soft">
          + Add Variant
        </Button>
      </section>

      <div className="grid grid-cols-3 gap-2 pt-4">
        <Button variant="default" className="bg-brand-primary hover:bg-brand-primary-dark" onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-soft">
          <ShoppingBasket className="mr-2 h-4 w-4" />
          Add Basket
        </Button>
        <Button variant="destructive" onClick={() => onDelete?.(collectible)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}

export default InventoryDetailSidebar
