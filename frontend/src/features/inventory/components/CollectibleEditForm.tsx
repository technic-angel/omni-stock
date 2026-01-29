import React, { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, X } from 'lucide-react'
import { nanoid } from 'nanoid'

import {
  collectibleSchema,
  CollectibleInput,
  buildVariantPayloads,
} from '../schema/itemSchema'
import { useUpdateCollectible } from '../hooks/useUpdateCollectible'
import { uploadImageToSupabase, validateImageFile, isSupabaseConfigured } from '@/shared/lib/supabase'
import VariantFields from './VariantFields'
import Card from '@/shared/components/Card'
import { Button } from '@/components/ui/button'
import type { Collectible } from '../../../shared/types'

type Props = {
  collectible: Collectible
  onSuccess?: () => void
}

const MAX_IMAGES = 6

type MediaItem = {
  id: string
  url: string
  mediaType: 'primary' | 'gallery'
  sortOrder: number
  width: number
  height: number
  sizeKb: number
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
  // Legacy field support (optional)
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
  
  // Media state
  const [media, setMedia] = useState<MediaItem[]>([])
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

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

  // Initialize form and media from collectible prop
  useEffect(() => {
    reset(mapCollectibleToForm(collectible))
    
    // Initialize media from existing images
    if (collectible.images && collectible.images.length > 0) {
      setMedia(collectible.images.map((img: any) => ({
        id: String(img.id),
        url: img.url,
        mediaType: img.is_primary ? 'primary' : (img.media_type || 'gallery'),
        sortOrder: img.sort_order || 0,
        width: img.width || 0,
        height: img.height || 0,
        sizeKb: img.size_kb || 0,
      })).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)))
    } else if (collectible.image_url) {
        // Fallback for legacy single image
        setMedia([{
            id: nanoid(),
            url: collectible.image_url,
            mediaType: 'primary',
            sortOrder: 0,
            width: 0,
            height: 0,
            sizeKb: 0
        }])
    }
  }, [collectible, reset])

  // Image Handlers
  const handleImageFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setImageUploadError(null)
    if (!isSupabaseConfigured()) {
      setImageUploadError('Image uploads are not configured.')
      event.target.value = ''
      return
    }

    const remainingSlots = MAX_IMAGES - media.length
    if (remainingSlots <= 0) {
      setImageUploadError(`Maximum ${MAX_IMAGES} images allowed.`)
      event.target.value = ''
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    setIsUploadingImage(true)

    try {
      for (const file of filesToUpload) {
        validateImageFile(file)
        // Use a generic path or store-specific if available (we don't have storeId in form state easily here, using 'edit-uploads')
        const uploadPath = `inventory-items/edit/${collectible.id}`
        const url = await uploadImageToSupabase(file, uploadPath)
        const bitmap = await createImageBitmap(file)
        
        setMedia((prev) => {
          const nextMedia: MediaItem = {
            id: nanoid(),
            url,
            mediaType: prev.length === 0 ? 'primary' : 'gallery',
            sortOrder: prev.length,
            width: bitmap.width,
            height: bitmap.height,
            sizeKb: Math.max(1, Math.round(file.size / 1024)),
          }
          return [...prev, nextMedia]
        })
      }
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleRemoveImage = (id: string) => {
    setMedia((prev) => {
      const remaining = prev.filter((m) => m.id !== id)
      return remaining.map((m, index) => ({
        ...m,
        mediaType: index === 0 ? 'primary' : 'gallery',
        sortOrder: index,
      }))
    })
  }

  const handleSetPrimaryImage = (id: string) => {
    setMedia((prev) => {
      const target = prev.find((m) => m.id === id)
      if (!target) return prev
      
      const others = prev
        .filter((m) => m.id !== id)
        .map((m, index) => ({ ...m, mediaType: 'gallery' as const, sortOrder: index + 1 }))
        
      return [{ ...target, mediaType: 'primary' as const, sortOrder: 0 }, ...others]
    })
  }

  const onSubmit = async (values: CollectibleInput) => {
    const variantPayloads = buildVariantPayloads(values.variants)
    
    // Construct media payloads from current state
    const imagePayloads = media.map((m, index) => ({
        url: m.url,
        media_type: index === 0 ? 'primary' : 'gallery',
        sort_order: index,
        width: m.width,
        height: m.height,
        size_kb: m.sizeKb
    }))

    const payload: Record<string, any> = { 
      ...values, 
      image_url: media.length > 0 ? media[0].url : null, // Legacy field sync
      card_metadata: values.card_details,
      image_payloads: imagePayloads
    }
    
    if (variantPayloads) {
      payload.variant_payloads = variantPayloads
    }
    
    // Cleanup
    delete (payload as any).image_file
    delete (payload as any).variants
    delete (payload as any).card_details

    await mutateAsync(payload)
    onSuccess?.()
  }

  return (
    <Card title={`Edit ${collectible.name}`}>
      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
        {/* Image Upload Section */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Item Images</label>
          {imageUploadError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {imageUploadError}
              </div>
          )}
          
          <div className="aspect-square w-full max-w-sm rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-brand-primary hover:bg-brand-primary-soft/30">
              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                  <ImagePlus className="h-8 w-8 text-brand-primary" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {media.length >= MAX_IMAGES
                    ? 'Maximum images reached'
                    : 'Click to upload images'}
                </span>
                <span className="mt-1 text-xs text-gray-500">
                  {media.length} / {MAX_IMAGES} uploaded
                </span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  disabled={isUploadingImage || media.length >= MAX_IMAGES}
                  onChange={handleImageFiles}
                />
              </label>
          </div>

          <div className="grid grid-cols-4 gap-4 max-w-sm">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-lg border border-gray-100 bg-gray-50 overflow-hidden"
                >
                  <img src={item.url} alt="Item" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(item.id)}
                    className="absolute top-1 right-1 rounded-full bg-white/80 p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-white transition-opacity"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {item.mediaType !== 'primary' && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(item.id)}
                      className="absolute bottom-1 left-1 right-1 rounded bg-black/50 px-1 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity"
                    >
                      Make Primary
                    </button>
                  )}
                  {item.mediaType === 'primary' && (
                    <div className="absolute bottom-1 left-1 right-1 rounded bg-brand-primary px-1 py-0.5 text-center text-[10px] font-bold text-white shadow-sm">
                      Primary
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Basic Fields */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Name</span>
            <input data-cy="edit-item-name" className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </label>
          
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">SKU</span>
            <input data-cy="edit-item-sku" className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" {...register('sku')} />
            {errors.sku && <p className="text-xs text-red-600">{errors.sku.message}</p>}
          </label>
          
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Quantity</span>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              {...register('quantity', { valueAsNumber: true })}
            />
            {errors.quantity && <p className="text-xs text-red-600">{errors.quantity.message}</p>}
          </label>
          
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Category</span>
            <select className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" {...register('category')}>
              <option value="pokemon_card">Pokémon Card</option>
              <option value="clothing">Clothing</option>
              <option value="video_game">Video Game</option>
              <option value="other">Other Collectible</option>
            </select>
          </label>
        </div>

        {/* Card Details (Only for Pokemon really, but mapped for all for now) */}
        <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
            <span className="text-gray-700 font-medium">Language</span>
            <input className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" {...register('card_details.language')} />
            </label>
            <label className="block text-sm">
            <span className="text-gray-700 font-medium">Market Region</span>
            <input className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" {...register('card_details.market_region')} />
            </label>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-sm font-semibold uppercase text-gray-500">Variants</h4>
            <VariantFields
            control={control}
            register={register}
            errors={errors}
            disabled={isPending || isUploadingImage}
            />
        </div>

        <div className="flex justify-end pt-4">
            <Button
            type="submit"
            data-cy="edit-item-submit"
            className="bg-brand-primary hover:bg-brand-primary-dark text-white"
            disabled={isPending || isUploadingImage}
            >
            {isPending || isUploadingImage ? 'Saving Changes…' : 'Save Changes'}
            </Button>
        </div>
      </form>
    </Card>
  )
}

export default CollectibleEditForm
