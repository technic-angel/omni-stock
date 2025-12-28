import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, Save, X, ChevronDown } from 'lucide-react'
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
  quantity: number
  intakePrice: string
  price: string
  projectedPrice: string
  cardDetails: CardDetails
  media: Array<{
    url: string
    mediaType: 'primary' | 'gallery'
    sortOrder: number
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

const AddCollectiblePage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createCollectible = useCreateCollectible()
  const { data: stores = [], isLoading: storesLoading, error: storesError } = useVendorStores()
  const noStoresAvailable = !storesLoading && !storesError && stores.length === 0
  const [category, setCategory] = useState<CategoryType>('pokemon')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
    return Object.fromEntries(
      Object.entries(form.cardDetails).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    ) as CardDetails
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
      },
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
              className="bg-brand-primary hover:bg-brand-primary-dark"
              onClick={handleSave}
              disabled={
                createCollectible.isLoading || storesLoading || noStoresAvailable || !!storesError
              }
            >
              <Save className="mr-2 h-4 w-4" />
              {createCollectible.isLoading ? 'Saving…' : 'Save Item'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[400px,1fr]">
        {/* Left Side: Images & Market Data */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Item Images
            </h3>

            <div className="aspect-square w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-brand-primary hover:bg-brand-primary-soft/30">
              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                  <ImagePlus className="h-8 w-8 text-brand-primary" />
                </div>
                <span className="text-sm font-medium text-gray-900">Click to upload images</span>
                <span className="mt-1 text-xs text-gray-500">PNG, JPG or WEBP up to 10MB</span>
                <input type="file" className="hidden" multiple accept="image/*" />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg border border-gray-100 bg-gray-50"
                />
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-400">
              The first image will be used as the primary display image for this item.
            </p>
          </div>

          <PriceHistory />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Variants
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  variants: [
                    ...prev.variants,
                    {
                      id: nanoid(),
                      condition: '',
                      grade: '',
                      quantity: 1,
                      priceAdjustment: '',
                    },
                  ],
                }))
              }
            >
              + Add Variant
            </Button>
          </div>
          {form.variants.length === 0 ? (
            <p className="text-sm text-gray-500">No variants yet.</p>
          ) : (
            <div className="space-y-4">
              {form.variants.map((variant, index) => (
                <div key={variant.id} className="grid gap-4 md:grid-cols-4 items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Condition</label>
                    <input
                      type="text"
                      placeholder="e.g. PSA 10, Raw"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      value={variant.condition}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          variants: prev.variants.map((item) =>
                            item.id === variant.id ? { ...item, condition: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Grade</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      value={variant.grade}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          variants: prev.variants.map((item) =>
                            item.id === variant.id ? { ...item, grade: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Quantity</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      value={variant.quantity}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          variants: prev.variants.map((item) =>
                            item.id === variant.id
                              ? { ...item, quantity: Number(e.target.value) || 0 }
                              : item,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="space-y-1 flex-1">
                      <label className="text-xs font-medium text-gray-600">Price Adj. ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        value={variant.priceAdjustment}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            variants: prev.variants.map((item) =>
                              item.id === variant.id
                                ? { ...item, priceAdjustment: e.target.value }
                                : item,
                            ),
                          }))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-500"
                      disabled={form.variants.length === 1}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          variants: prev.variants.filter((item) => item.id !== variant.id),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Details */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                General Information
              </h3>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                <label htmlFor="add-item-store" className="sr-only">
                  Assign to Store
                </label>
                <select
                  id="add-item-store"
                  value={form.storeId}
                  className="bg-transparent font-bold text-gray-900 focus:outline-none"
                  disabled={storesLoading || !!storesError || stores.length === 0}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      storeId: e.target.value,
                    }))
                  }
                >
                  {storesLoading && <option>Loading stores…</option>}
                  {storesError && <option>Error loading stores</option>}
                  {!storesLoading && !storesError && stores.length === 0 && (
                    <option>No stores available</option>
                  )}
                  {!storesLoading &&
                    !storesError &&
                    stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="add-item-name">
                  Item Name
                </label>
                <input
                  id="add-item-name"
                  type="text"
                  placeholder="e.g. Charizard VMAX - Shining Fates"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="add-item-category">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="add-item-category"
                    value={category}
                    onChange={(e) => {
                      const nextCategory = e.target.value as CategoryType
                      setCategory(nextCategory)
                      setForm((prev) => ({
                        ...prev,
                        category: CATEGORY_TO_API[nextCategory],
                      }))
                    }}
                    className="w-full appearance-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="pokemon">Pokémon Card</option>
                    <option value="clothing">Clothing / Apparel</option>
                    <option value="videogame">Video Games</option>
                    <option value="other">Other Collectible</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="add-item-sku">
                  SKU / Identifier
                </label>
                <input
                  id="add-item-sku"
                  type="text"
                  placeholder="e.g. POK-SF-001"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={form.sku}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sku: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="add-item-quantity">
                  Initial Quantity
                </label>
                <input
                  id="add-item-quantity"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantity: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="add-item-price">
                  Base Price ($)
                </label>
                <input
                  id="add-item-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700"
                  htmlFor="add-item-intake-price"
                >
                  Intake Price ($)
                </label>
                <input
                  id="add-item-intake-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={form.intakePrice}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      intakePrice: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700"
                  htmlFor="add-item-projected-price"
                >
                  Projected Price ($)
                </label>
                <input
                  id="add-item-projected-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={form.projectedPrice}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      projectedPrice: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="add-item-status">
                  Status
                </label>
                <select
                  id="add-item-status"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as InventoryStatus,
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Category Fields */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
              {category.charAt(0).toUpperCase() + category.slice(1)} Specific Details
            </h3>
            {renderCategoryFields()}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Description & Notes
            </h3>
            <textarea
              rows={4}
              placeholder="Add any specific details about this item..."
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>
    </Page>
  )
}

export default AddCollectiblePage
