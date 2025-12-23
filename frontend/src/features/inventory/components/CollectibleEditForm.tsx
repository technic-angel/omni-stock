import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Card from '../../../shared/components/Card'
import type { Collectible } from '../../../shared/types'
import {
  collectibleSchema,
  CollectibleInput,
  buildVariantPayloads,
} from '../schema/itemSchema'
import { useUpdateCollectible } from '../hooks/useUpdateCollectible'
import { useCollectibleImageUpload } from '../hooks/useCollectibleImageUpload'
import VariantFields from './VariantFields'

type Props = {
  collectible: Collectible
  onSuccess?: () => void
}

const mapCollectibleToForm = (collectible: Collectible): CollectibleInput => ({
  name: collectible.name || '',
  sku: collectible.sku || '',
  quantity: collectible.quantity ?? 0,
  category: collectible.category || 'pokemon_card',
  card_details: {
    language: collectible.card_details?.language || '',
    market_region: collectible.card_details?.market_region || '',
    psa_grade: collectible.card_details?.psa_grade || '',
    condition: collectible.card_details?.condition || '',
  },
  image_url: collectible.image_url || undefined,
  image_file: undefined,
  variants:
    collectible.variants?.map((variant) => ({
      condition: variant.condition || '',
      grade: variant.grade || '',
      quantity: variant.quantity ?? 0,
      price_adjustment: variant.price_adjustment || '',
    })) ?? [],
})

const CollectibleEditForm = ({ collectible, onSuccess }: Props) => {
  const { mutateAsync, isPending } = useUpdateCollectible(collectible.id)
  const {
    upload,
    isUploading,
    error: uploadError,
    resetError: resetUploadError,
  } = useCollectibleImageUpload()
  const {
    register,
    control,
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

  const imageFileInput = register('image_file')

  const onSubmit = async (values: CollectibleInput) => {
    let imageUrl = collectible.image_url
    if (values.image_file) {
      const file = values.image_file instanceof File ? values.image_file : undefined
      if (file) {
        try {
          imageUrl = await upload(file)
        } catch {
          return
        }
      }
    } else if (values.image_url) {
      imageUrl = values.image_url
    }

    const variantPayloads = buildVariantPayloads(values.variants)
    const payload: Record<string, any> = { 
      ...values, 
      image_url: imageUrl,
      card_metadata: values.card_details
    }
    if (variantPayloads) {
      payload.variant_payloads = variantPayloads
    }
    delete (payload as any).image_file
    delete (payload as any).variants
    delete (payload as any).card_details

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
          Category
          <select className="mt-1 w-full rounded border p-2" {...register('category')}>
            <option value="pokemon_card">Pokémon Card</option>
            <option value="sealed_product">Sealed Product</option>
          </select>
        </label>
        <label className="block text-sm">
          Language
          <input className="mt-1 w-full rounded border p-2" {...register('card_details.language')} />
        </label>
        <label className="block text-sm">
          Market Region
          <input className="mt-1 w-full rounded border p-2" {...register('card_details.market_region')} />
        </label>
        <VariantFields
          control={control}
          register={register}
          errors={errors}
          disabled={isPending || isUploading}
        />
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
            {...imageFileInput}
            onChange={(event) => {
              resetUploadError()
              imageFileInput.onChange(event)
            }}
          />
        </label>
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        <button
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={isPending || isUploading}
        >
          {isPending || isUploading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </Card>
  )
}

export default CollectibleEditForm
