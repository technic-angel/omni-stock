import React from 'react'

const ClothingFields = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Size</label>
        <select className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20">
          <option>XS</option>
          <option>S</option>
          <option>M</option>
          <option>L</option>
          <option>XL</option>
          <option>XXL</option>
          <option>One Size</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Color</label>
        <input
          type="text"
          placeholder="e.g. Navy Blue"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Material</label>
        <input
          type="text"
          placeholder="e.g. 100% Cotton"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Brand</label>
        <input
          type="text"
          placeholder="e.g. Nike, Supreme"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>
    </div>
  )
}

export default ClothingFields
