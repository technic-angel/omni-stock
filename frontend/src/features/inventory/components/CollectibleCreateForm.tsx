import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Card from '../../../shared/components/Card'
import { useCreateCollectible } from '../hooks/useCreateCollectible'
import { collectibleSchema, CollectibleInput } from '../schema/itemSchema'
import { uploadImageToSupabase } from '../../../shared/lib/supabase'

type Props = {
  onCreated?: () => void
}

const CollectibleCreateForm = ({ onCreated }: Props) => {
  const { mutateAsync, isPending } = useCreateCollectible()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectibleInput>({
    resolver: zodResolver(collectibleSchema),
    defaultValues: {
      name: '',
      sku: '',
      quantity: 0,
      language: '',
      market_region: '',
      image_file: undefined,
    },
  })

  const onSubmit = async (values: CollectibleInput) => {
    let imageUrl: string | undefined
    if (values.image_file) {
      const file =
        values.image_file instanceof File ? values.image_file : (values.image_file as any)
      imageUrl = file ? await uploadImageToSupabase(file as File) : undefined
    }
    const payload = { ...values, image_url: imageUrl }
    delete (payload as any).image_file

    await mutateAsync(payload)
    reset()
    onCreated?.()
  }

  return (
    <Card title="Add Collectible">
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
        <label className="block text-sm">
          Image
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
          {isPending ? 'Saving…' : 'Create'}
        </button>
      </form>
    </Card>
  )
}

export default CollectibleCreateForm
