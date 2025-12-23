import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, Save, X, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import Page from '../../../shared/components/Page'
import PokemonFields from '../components/forms/PokemonFields'
import ClothingFields from '../components/forms/ClothingFields'
import VideoGameFields from '../components/forms/VideoGameFields'
import PriceHistory from '../components/PriceHistory'

type CategoryType = 'pokemon' | 'clothing' | 'videogame' | 'other'

const AddCollectiblePage = () => {
  const navigate = useNavigate()
  const [category, setCategory] = useState<CategoryType>('pokemon')

  const renderCategoryFields = () => {
    switch (category) {
      case 'pokemon':
        return <PokemonFields />
      case 'clothing':
        return <ClothingFields />
      case 'videogame':
        return <VideoGameFields />
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/inventory')}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button className="bg-brand-primary hover:bg-brand-primary-dark">
            <Save className="mr-2 h-4 w-4" />
            Save Item
          </Button>
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
                <div key={i} className="aspect-square rounded-lg border border-gray-100 bg-gray-50" />
              ))}
            </div>
            
            <p className="mt-4 text-xs text-gray-400">
              The first image will be used as the primary display image for this item.
            </p>
          </div>

          <PriceHistory />
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
                  className="bg-transparent font-bold text-gray-900 focus:outline-none"
                >
                  <option>Flagship Store</option>
                  <option>Secondary Store</option>
                  <option>Warehouse</option>
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
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
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
                  defaultValue="1"
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
                />
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
            />
          </div>
        </div>
      </div>
    </Page>
  )
}

export default AddCollectiblePage
