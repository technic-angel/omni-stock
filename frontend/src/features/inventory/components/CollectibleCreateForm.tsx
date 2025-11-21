import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Card from '../../../shared/components/Card'
import { useCreateCollectible } from '../hooks/useCreateCollectible'
import { collectibleSchema, CollectibleInput } from '../schema/itemSchema'

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
    defaultValues: { name: '', sku: '', quantity: 0, language: '', market_region: '' },
  })

  const onSubmit = async (values: CollectibleInput) => {
    await mutateAsync(values)
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
        <button className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50" disabled={isPending}>
          {isPending ? 'Saving…' : 'Create'}
        </button>
      </form>
    </Card>
  )
}

export default CollectibleCreateForm
