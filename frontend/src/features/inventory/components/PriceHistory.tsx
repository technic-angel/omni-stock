import React from 'react'
import { TrendingUp, ExternalLink } from 'lucide-react'

const PriceHistory = () => {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-gray-900">Market Insights</h3>
        </div>
        <button className="flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline">
          View External <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between border-b border-gray-50 pb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Current Market Price</p>
            <p className="text-2xl font-bold text-gray-900">$0.00</p>
          </div>
          <div className="text-right text-xs text-gray-400 italic">
            No data available yet
          </div>
        </div>

        <div className="flex h-32 items-center justify-center rounded-lg bg-gray-50 border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">Price history chart will appear here</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-[10px] text-gray-500 uppercase">Low (30d)</p>
            <p className="font-semibold text-gray-700">--</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-[10px] text-gray-500 uppercase">High (30d)</p>
            <p className="font-semibold text-gray-700">--</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceHistory
