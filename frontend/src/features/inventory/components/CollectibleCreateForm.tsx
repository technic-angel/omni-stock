import React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'

import Card from '../../../shared/components/Card'
import { useCreateCollectible } from '../hooks/useCreateCollectible'
import {
  collectibleSchema,
  CollectibleInput,
  buildVariantPayloads,
} from '../schema/itemSchema'
import { useCollectibleImageUpload } from '../hooks/useCollectibleImageUpload'
import VariantFields from './VariantFields'

type Props = {
  onCreated?: () => void
}

const CollectibleCreateForm = ({ onCreated }: Props) => {
  const { mutateAsync, isPending } = useCreateCollectible()
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
    setValue,
    reset,
    formState: { errors },
  } = useForm<CollectibleInput>({
    resolver: zodResolver(collectibleSchema),
    defaultValues: {
      name: '',
      sku: '',
      quantity: 0,
      category: 'pokemon_card',
      card_details: {
        language: '',
        market_region: '',
      },
      image_file: undefined,
      variants: [],
    },
  })

  const nameValue = useWatch({ control, name: 'name' })

  const handleGenerateSku = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!nameValue) return
    
    const suggestedSku = nameValue
      .toUpperCase()
      .replace(/['"]/g, '')
      .replace(/[^\w\s-]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') // Trim dashes

    setValue('sku', suggestedSku, { shouldValidate: true, shouldDirty: true })
  }

  const imageFileInput = register('image_file')

  const onSubmit = async (values: CollectibleInput) => {
    let imageUrl: string | undefined
    const file = values.image_file instanceof File ? values.image_file : undefined
    if (file) {
      try {
        imageUrl = await upload(file)
      } catch {
        return
      }
    }
    const variantPayloads = buildVariantPayloads(values.variants)
    const payload: Record<string, any> = { 
      ...values, 
      image_url: imageUrl,
      card_metadata: values.card_details // Backend expects card_metadata
    }
    if (variantPayloads) {
      payload.variant_payloads = variantPayloads
    }
    delete (payload as any).image_file
    delete (payload as any).variants
    delete (payload as any).card_details

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
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <label htmlFor="sku-input" className="block font-medium">
              SKU
            </label>
            <button
              onClick={handleGenerateSku}
              type="button"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
              disabled={!nameValue}
              title="Generate SKU from Name"
            >
              <Save className="h-3 w-3" />
              Auto-generate
            </button>
          </div>
          <input
            id="sku-input"
            className="w-full rounded border p-2"
            {...register('sku')}
          />
          {errors.sku && <p className="text-xs text-red-600">{errors.sku.message}</p>}
        </div>
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
        <label className="block text-sm">
          Image
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
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </label>
        <button
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={isPending || isUploading}
        >
          {isPending || isUploading ? 'Saving…' : 'Create'}
        </button>
      </form>
    </Card>
  )
}

export default CollectibleCreateForm
