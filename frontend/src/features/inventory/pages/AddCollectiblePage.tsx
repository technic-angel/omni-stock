import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, Save, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { nanoid } from 'nanoid'

import { Button } from '@/components/ui/button'
import Page from '../../../shared/components/Page'
import PokemonFields, { type PokemonFieldValues } from '../components/forms/PokemonFields'
import ClothingFields, { type ClothingFieldValues } from '../components/forms/ClothingFields'
import VideoGameFields, { type VideoGameFieldValues } from '../components/forms/VideoGameFields'
import PriceHistory from '../components/PriceHistory'
import { useCreateCollectible } from '../hooks/useCreateCollectible'
import { useVendorStores } from '../../vendors/hooks/useVendorStores'
import { useCatalogProducts } from '../hooks/useCatalogProducts'
import {
  uploadImageToSupabase,
  validateImageFile,
  isSupabaseConfigured,
} from '@/shared/lib/supabase'

type CategoryType = 'pokemon' | 'clothing' | 'videogame' | 'other'
type BackendCategory = 'pokemon_card' | 'clothing' | 'video_game' | 'other'
type InventoryStatus = 'active' | 'low_stock' | 'archived'

type CardDetails = PokemonFieldValues &
  ClothingFieldValues &
  VideoGameFieldValues &
  Record<string, string>

type BaseFormState = {
  storeId: string
  name: string
  sku: string
  description: string
  category: BackendCategory
  status: InventoryStatus
  product?: string
  quantity: number
  intakePrice: string
  price: string
  projectedPrice: string
  cardDetails: CardDetails
  media: Array<{
    id: string
    url: string
    mediaType: 'primary' | 'gallery'
    sortOrder: number
    width: number
    height: number
    sizeKb: number
  }>
  variants: Array<{
    id: string
    condition: string
    grade?: string
    quantity: number
    priceAdjustment?: string
  }>
}

const CATEGORY_TO_API: Record<CategoryType, BackendCategory> = {
  pokemon: 'pokemon_card',
  clothing: 'clothing',
  videogame: 'video_game',
  other: 'other',
}
const MAX_IMAGES = 5

const AddCollectiblePage = () => {
  console.log('Rendering AddCollectiblePage');
  
  try {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const createCollectible = useCreateCollectible()
    const { data: storesData, isLoading: storesLoading, error: storesError } = useVendorStores()
    
    // Handle paginated vs non-paginated data (backend may return results array or direct array)
    const stores = useMemo(() => {
      if (!storesData) return []
      if (Array.isArray(storesData)) return storesData
      if (typeof storesData === 'object' && storesData !== null && 'results' in storesData && Array.isArray(storesData.results)) {
        return storesData.results as any[]
      }
      return []
    }, [storesData])
    
    const [productSearch, setProductSearch] = useState('')
    const { data: productsPage } = useCatalogProducts(productSearch)
    const products = productsPage?.results || []

    const noStoresAvailable = !storesLoading && !storesError && stores.length === 0
    const [category, setCategory] = useState<CategoryType>('pokemon')
    
    const handleCategoryChange = (newCat: CategoryType) => {
      setCategory(newCat)
      setForm(prev => ({
        ...prev,
        category: CATEGORY_TO_API[newCat],
        cardDetails: {}, // Clear details when switching categories
      }))
    }

    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [imageUploadError, setImageUploadError] = useState<string | null>(null)
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [form, setForm] = useState<BaseFormState>({
      storeId: '',
      name: '',
      sku: '',
      description: '',
      category: CATEGORY_TO_API['pokemon'],
      status: 'active',
      quantity: 1,
      intakePrice: '',
      price: '',
      projectedPrice: '',
      cardDetails: {},
      media: [],
      variants: [
        {
          id: nanoid(),
          condition: '',
          grade: '',
          quantity: 1,
          priceAdjustment: '',
        },
      ],
    })

    const handleGenerateSku = (e: React.MouseEvent) => {
      e.preventDefault()
      if (!form.name) return
      
      const suggestedSku = form.name
        .toUpperCase()
        .replace(/['"]/g, '')
        .replace(/[^\w\s-]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')

      setForm(prev => ({ ...prev, sku: suggestedSku }))
    }

    const handleCardDetailsChange = (updates: Partial<CardDetails>) => {
      setForm((prev) => ({
        ...prev,
        cardDetails: { ...prev.cardDetails, ...updates },
      }))
    }

    useEffect(() => {
      if (!storesLoading && !storesError && stores.length > 0 && !form.storeId) {
        setForm((prev) => ({ ...prev, storeId: String(stores[0].id) }))
      }
    }, [storesLoading, storesError, stores, form.storeId])

    const sanitizedCardDetails = useMemo<CardDetails>(() => {
      const details: Record<string, any> = {};
      Object.entries(form.cardDetails).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          details[key] = value;
        }
      });
      return details as CardDetails;
    }, [form.cardDetails])

    const sanitizedVariants = useMemo(() => {
      return form.variants
        .filter((variant) => variant.condition.trim())
        .map((variant, index) => ({
          condition: variant.condition.trim(),
          grade: variant.grade?.trim() || undefined,
          quantity: variant.quantity || 0,
          price_adjustment: variant.priceAdjustment || '0',
          sort_order: index,
        }))
    }, [form.variants])

    const imagePayloads = useMemo(
      () =>
        form.media.map((media, index) => ({
          url: media.url,
          media_type: index === 0 ? 'primary' : media.mediaType,
          sort_order: index,
          width: media.width,
          height: media.height,
          size_kb: media.sizeKb,
        })),
      [form.media],
    )

    const handleImageFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) {
        return
      }
      setImageUploadError(null)
      if (!isSupabaseConfigured()) {
        setImageUploadError('Image uploads are not configured. Please contact support.')
        event.target.value = ''
        return
      }
      const remainingSlots = MAX_IMAGES - form.media.length
      if (remainingSlots <= 0) {
        setImageUploadError(`You can upload up to ${MAX_IMAGES} images per item.`)
        event.target.value = ''
        return
      }
      const filesToUpload = Array.from(files).slice(0, remainingSlots)
      setIsUploadingImage(true)
      try {
        for (const file of filesToUpload) {
          validateImageFile(file)
          const uploadPath = `inventory-items/${form.storeId || 'unassigned'}`
          const url = await uploadImageToSupabase(file, uploadPath)
          const bitmap = await createImageBitmap(file)
          setForm((prev) => {
            const nextMedia = [
              ...prev.media,
              {
                id: nanoid(),
                url,
                mediaType: prev.media.length === 0 ? 'primary' : 'gallery',
                sortOrder: prev.media.length,
                width: bitmap.width,
                height: bitmap.height,
                sizeKb: Math.max(1, Math.round(file.size / 1024)),
              },
            ]
            return { ...prev, media: nextMedia }
          })
        }
      } catch (error) {
        setImageUploadError(
          error instanceof Error ? error.message : 'Failed to upload image.',
        )
      } finally {
        setIsUploadingImage(false)
        event.target.value = ''
      }
    }

    const handleRemoveImage = (id: string) => {
      setForm((prev) => {
        const remaining = prev.media.filter((media) => media.id !== id)
        const normalized = remaining.map((media, index) => ({
          ...media,
          mediaType: index === 0 ? 'primary' : 'gallery',
          sortOrder: index,
        }))
        return { ...prev, media: normalized }
      });
    };

    const handleSetPrimaryImage = (id: string) => {
      setForm((prev) => {
        const target = prev.media.find((media) => media.id === id)
        if (!target) {
          return prev
        }
        const others = prev.media
          .filter((media) => media.id !== id)
          .map((media, index) => ({
            ...media,
            mediaType: 'gallery',
            sortOrder: index + 1,
          }))
        const reordered = [
          { ...target, mediaType: 'primary', sortOrder: 0 },
          ...others,
        ]
        return { ...prev, media: reordered }
      })
    }

    const handleSave = () => {
      setErrorMessage(null)
      if (!form.name.trim() || !form.sku.trim()) {
        setErrorMessage('Name and SKU are required.')
        return
      }
      if (!form.storeId) {
        setErrorMessage('Please select a store.')
        return
      }
      if (storesLoading) {
        setErrorMessage('Stores are still loading. Please wait.')
        return
      }

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        store: Number(form.storeId),
        category: form.category,
        status: form.status,
        quantity: form.quantity,
        intake_price: form.intakePrice || '0',
        price: form.price || '0',
        projected_price: form.projectedPrice || '0',
        description: form.description,
        card_details: sanitizedCardDetails,
        variant_payloads: sanitizedVariants,
        product: form.product ? Number(form.product) : null,
      }
      if (imagePayloads.length > 0) {
        ;(payload as any).image_payloads = imagePayloads
      }

      createCollectible.mutate(payload, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['inventory', 'overview'] })
          navigate('/inventory')
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.detail ||
            error?.message ||
            'Something went wrong while saving the item.'
          setErrorMessage(message)
        }
      })
    }

    const renderCategoryFields = () => {
      switch (category) {
        case 'pokemon':
          return <PokemonFields values={form.cardDetails} onChange={handleCardDetailsChange} />
        case 'clothing':
          return <ClothingFields values={form.cardDetails} onChange={handleCardDetailsChange} />
        case 'videogame':
          return <VideoGameFields values={form.cardDetails} onChange={handleCardDetailsChange} />
        default:
          return (
            <div className="rounded-lg bg-gray-50 p-8 text-center border border-dashed border-gray-200">
              <p className="text-sm text-gray-500">No additional fields for this category.</p>
            </div>
          )
      }
    }

    return (
      <Page
        title="Add New Item"
        subtitle="Create a new collectible in your inventory"
        dataCy="add-collectible-page"
        actions={
          <div className="flex flex-col items-end gap-2">
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            {storesError && (
              <p className="text-sm text-red-600">Unable to load stores. Please try again.</p>
            )}
            {noStoresAvailable && (
              <p className="text-sm text-amber-600">
                You need at least one store before adding inventory.
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/inventory')}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="button"
                data-cy="add-item-submit"
                className="bg-brand-primary hover:bg-brand-primary-dark"
                onClick={handleSave}
                disabled={
                  createCollectible.isPending || storesLoading || noStoresAvailable || !!storesError
                }
              >
                <Save className="mr-2 h-4 w-4" />
                {createCollectible.isPending ? 'Saving…' : 'Save Item'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid gap-8 lg:grid-cols-[400px,1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Item Images
              </h3>

              {imageUploadError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {imageUploadError}
                </div>
              )}

              <div className="aspect-square w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-brand-primary hover:bg-brand-primary-soft/30">
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 text-center">
                  <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                    <ImagePlus className="h-8 w-8 text-brand-primary" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {form.media.length >= MAX_IMAGES
                      ? 'Maximum images reached'
                      : 'Click to upload images'}
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    {form.media.length} / {MAX_IMAGES} uploaded
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    disabled={isUploadingImage || form.media.length >= MAX_IMAGES}
                    onChange={handleImageFiles}
                  />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {form.media.map((media) => (
                  <div
                    key={media.id}
                    className="group relative aspect-square rounded-lg border border-gray-100 bg-gray-50 overflow-hidden"
                  >
                    <img src={media.url} alt="Item" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(media.id)}
                      className="absolute top-1 right-1 rounded-full bg-white/80 p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-white transition-opacity"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {media.mediaType === 'primary' && (
                        <div className="absolute bottom-1 left-1 right-1 rounded bg-brand-primary px-1 py-0.5 text-center text-[10px] font-bold text-white shadow-sm">
                        Primary
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <PriceHistory />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-500">General Information</h3>
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Item Name</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                            value={form.name}
                            placeholder="e.g. Charizard Base Set"
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">SKU</label>
                            <button
                                onClick={handleGenerateSku}
                                type="button"
                                className="flex items-center gap-1 text-xs text-brand-primary"
                            >
                                <Save className="h-3 w-3" /> Auto-generate
                            </button>
                        </div>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                            value={form.sku}
                            placeholder="e.g. PKMN-BS-004"
                            onChange={e => setForm(prev => ({ ...prev, sku: e.target.value }))}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <select
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                            value={category}
                            onChange={e => handleCategoryChange(e.target.value as CategoryType)}
                        >
                            <option value="pokemon">Pokémon Card</option>
                            <option value="clothing">Clothing / Fashion</option>
                            <option value="videogame">Video Game</option>
                            <option value="other">Other Collectible</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Store</label>
                        <select
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                            value={form.storeId}
                            onChange={e => setForm(prev => ({ ...prev, storeId: e.target.value }))}
                        >
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-500">Pricing & Quantity</h3>
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Cost Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                            value={form.intakePrice}
                            onChange={e => setForm(prev => ({ ...prev, intakePrice: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Listing Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                            value={form.price}
                            onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Stock Quantity</label>
                        <input
                            type="number"
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                            value={form.quantity}
                            onChange={e => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-500">Category Details</h3>
                {renderCategoryFields()}
            </div>
          </div>
        </div>
      </Page>
    )
  } catch (err) {
    console.error('Render Error:', err);
    return <div className="p-10 text-red-600">Error rendering page: {String(err)}</div>
  }
}

export default AddCollectiblePage;
