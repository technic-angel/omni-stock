import React from 'react'
import { Control, FieldErrors, useFieldArray, UseFormRegister } from 'react-hook-form'

import type { CollectibleInput } from '../schema/itemSchema'

type Props = {
  control: Control<CollectibleInput>
  register: UseFormRegister<CollectibleInput>
  errors: FieldErrors<CollectibleInput>
  disabled?: boolean
}

const VariantFields = ({ control, register, errors, disabled }: Props) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Variants</h3>
        <button
          type="button"
          className="rounded border border-blue-600 px-2 py-1 text-xs font-medium text-blue-600 disabled:opacity-50"
          onClick={() =>
            append({
              condition: '',
              grade: '',
              quantity: 0,
              price_adjustment: '',
            })
          }
          disabled={disabled}
        >
          Add Variant
        </button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-gray-500">
          No variants added. Use “Add Variant” to capture graded/raw breakdowns.
        </p>
      )}
      {fields.map((field, index) => {
        const variantErrors = Array.isArray(errors.variants)
          ? errors.variants[index]
          : undefined
        return (
          <div key={field.id} className="space-y-2 rounded border p-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Variant {index + 1}</span>
              <button
                type="button"
                className="text-red-600"
                onClick={() => remove(index)}
                disabled={disabled}
              >
                Remove
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-xs">
                Variant {index + 1} Condition
                <input
                  className="mt-1 w-full rounded border p-2"
                  disabled={disabled}
                  {...register(`variants.${index}.condition` as const)}
                />
              </label>
              <label className="block text-xs">
                Variant {index + 1} Grade
                <input
                  className="mt-1 w-full rounded border p-2"
                  disabled={disabled}
                  {...register(`variants.${index}.grade` as const)}
                />
              </label>
              <label className="block text-xs">
                Variant {index + 1} Quantity
                <input
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  disabled={disabled}
                  {...register(`variants.${index}.quantity` as const, {
                    valueAsNumber: true,
                  })}
                />
                {variantErrors?.quantity && (
                  <p className="text-[11px] text-red-600">{variantErrors.quantity.message}</p>
                )}
              </label>
              <label className="block text-xs">
                Variant {index + 1} Price Adjustment
                <input
                  className="mt-1 w-full rounded border p-2"
                  disabled={disabled}
                  placeholder="e.g. 100.00"
                  {...register(`variants.${index}.price_adjustment` as const)}
                />
              </label>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default VariantFields
