import React from 'react'

export type ClothingFieldValues = {
  size?: string
  color?: string
  material?: string
  brand?: string
}

type ClothingFieldsProps = {
  values: ClothingFieldValues
  onChange: (updates: ClothingFieldValues) => void
}

const ClothingFields: React.FC<ClothingFieldsProps> = ({ values, onChange }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="clothing-size">
          Size
        </label>
        <select
          id="clothing-size"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.size ?? ''}
          onChange={(e) => onChange({ size: e.target.value })}
        >
          <option value="">Select size…</option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
          <option value="one_size">One Size</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="clothing-color">
          Color
        </label>
        <input
          id="clothing-color"
          type="text"
          placeholder="e.g. Navy Blue"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.color ?? ''}
          onChange={(e) => onChange({ color: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="clothing-material">
          Material
        </label>
        <input
          id="clothing-material"
          type="text"
          placeholder="e.g. 100% Cotton"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.material ?? ''}
          onChange={(e) => onChange({ material: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="clothing-brand">
          Brand
        </label>
        <input
          id="clothing-brand"
          type="text"
          placeholder="e.g. Nike, Supreme"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.brand ?? ''}
          onChange={(e) => onChange({ brand: e.target.value })}
        />
      </div>
    </div>
  )
}

export default ClothingFields
