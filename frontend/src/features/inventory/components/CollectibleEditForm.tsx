import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Card from '../../../shared/components/Card'
import type { Collectible } from '../../../shared/types'
import { collectibleSchema, CollectibleInput } from '../schema/itemSchema'
import { uploadImageToSupabase } from '../../../shared/lib/supabase'
import { useUpdateCollectible } from '../hooks/useUpdateCollectible'

type Props = {
  collectible: Collectible
  onSuccess?: () => void
}

const mapCollectibleToForm = (collectible: Collectible): CollectibleInput => ({
  name: collectible.name || '',
  sku: collectible.sku || '',
  quantity: collectible.quantity ?? 0,
  language: collectible.language || '',
  market_region: collectible.market_region || '',
  image_url: collectible.image_url || undefined,
  image_file: undefined,
})

const CollectibleEditForm = ({ collectible, onSuccess }: Props) => {
  const { mutateAsync, isPending } = useUpdateCollectible(collectible.id)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectibleInput>({
    resolver: zodResolver(collectibleSchema),
    defaultValues: mapCollectibleToForm(collectible),
  })

  useEffect(() => {
    reset(mapCollectibleToForm(collectible))
  }, [collectible, reset])

  const onSubmit = async (values: CollectibleInput) => {
    let imageUrl = collectible.image_url
    if (values.image_file) {
      const file = values.image_file instanceof File ? values.image_file : undefined
      if (file) {
        imageUrl = await uploadImageToSupabase(file)
      }
    } else if (values.image_url) {
      imageUrl = values.image_url
    }

    const payload = { ...values, image_url: imageUrl }
    delete (payload as any).image_file

    await mutateAsync(payload)
    onSuccess?.()
  }

  return (
    <Card title={`Edit ${collectible.name}`}>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm">
          Name
          <input className="mt-1 w-full rounded border p-2" {...register('name')} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </label>
        <label className="block text-sm">
          SKU
          <input className="mt-1 w-full rounded border p-2" {...register('sku')} />
          {errors.sku && <p className="text-xs text-red-600">{errors.sku.message}</p>}
        </label>
        <label className="block text-sm">
          Quantity
          <input
            type="number"
            className="mt-1 w-full rounded border p-2"
            {...register('quantity', { valueAsNumber: true })}
          />
          {errors.quantity && <p className="text-xs text-red-600">{errors.quantity.message}</p>}
        </label>
        <label className="block text-sm">
          Language
          <input className="mt-1 w-full rounded border p-2" {...register('language')} />
        </label>
        <label className="block text-sm">
          Market Region
          <input className="mt-1 w-full rounded border p-2" {...register('market_region')} />
        </label>
        <div className="text-xs text-gray-500">
          Current image:{' '}
          {collectible.image_url ? (
            <a
              href={collectible.image_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600"
            >
              preview
            </a>
          ) : (
            'none'
          )}
        </div>
        <label className="block text-sm">
          Replace Image
          <input
            type="file"
            accept="image/*"
            className="mt-1 w-full rounded border p-2"
            {...register('image_file')}
          />
        </label>
        <button
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </Card>
  )
}

export default CollectibleEditForm
