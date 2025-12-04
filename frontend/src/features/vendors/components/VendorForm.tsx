import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Card from '../../../shared/components/Card'
import { vendorSchema, VendorInput } from '../schema/vendorSchema'
import { useCreateVendor } from '../hooks/useCreateVendor'

type Props = {
  onCreated?: () => void
}

const VendorForm = ({ onCreated }: Props) => {
  const { mutateAsync, isPending } = useCreateVendor()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorInput>({
    resolver: zodResolver(vendorSchema),
    defaultValues: { name: '', description: '', contact_info: '' },
  })

  const onSubmit = async (values: VendorInput) => {
    await mutateAsync(values)
    reset()
    onCreated?.()
  }

  return (
    <Card title="Create Vendor">
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm">
          Name
          <input className="mt-1 w-full rounded border p-2" {...register('name')} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </label>
        <label className="block text-sm">
          Description
          <textarea
            className="mt-1 w-full rounded border p-2"
            rows={2}
            {...register('description')}
          />
        </label>
        <label className="block text-sm">
          Contact Info
          <textarea
            className="mt-1 w-full rounded border p-2"
            rows={2}
            {...register('contact_info')}
          />
        </label>
        <div className="flex justify-end">
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? 'Saving…' : 'Create'}
          </button>
        </div>
      </form>
    </Card>
  )
}

export default VendorForm
