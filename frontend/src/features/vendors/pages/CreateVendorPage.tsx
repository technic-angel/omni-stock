import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'

import Page from '../../../shared/components/Page'
import { useCreateVendor } from '../hooks/useCreateVendor'
import { vendorSchema, type VendorInput } from '../schema/vendorSchema'

const CreateVendorPage = () => {
  const navigate = useNavigate()
  const { mutateAsync, isPending, error } = useCreateVendor()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorInput>({
    resolver: zodResolver(vendorSchema),
    defaultValues: { name: '', description: '', contact_info: '' },
  })

  const mutationError = error instanceof Error ? error.message : null

  const onSubmit = async (values: VendorInput) => {
    try {
      await mutateAsync(values)
      reset()
      navigate('/vendors')
    } catch {
      // Mutation error handled via react-query state
    }
  }

  return (
    <Page
      title="Create your vendor"
      subtitle="Vendors let you organize stores, invite team members, and manage brand assets."
      dataCy="create-vendor-page"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-sm text-emerald-800">
          <p className="font-semibold">Why create a vendor?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-emerald-900">
            <li>Link multiple stores under one brand.</li>
            <li>Invite teammates and manage their permissions.</li>
            <li>Upload logos, banners, and other shared media.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">Vendor details</h2>
            <p className="text-sm text-gray-500">We’ll use this information throughout your organization.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label htmlFor="vendor-name" className="text-sm font-medium text-gray-700">
                Vendor name
              </label>
              <input
                id="vendor-name"
                type="text"
                placeholder="e.g. Tech Ship Inc"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
                {...register('name')}
                disabled={isPending}
              />
              {errors.name ? (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              ) : (
                <p className="text-xs text-gray-500">Pick something that teammates will recognize.</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="vendor-description" className="text-sm font-medium text-gray-700">
                Short description
              </label>
              <textarea
                id="vendor-description"
                rows={3}
                placeholder="Tell teammates what this vendor covers."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
                {...register('description')}
                disabled={isPending}
              />
              {errors.description && (
                <p className="text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="vendor-contact" className="text-sm font-medium text-gray-700">
                Contact info
              </label>
              <textarea
                id="vendor-contact"
                rows={3}
                placeholder="Emails, phone numbers, or any structure you prefer."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
                {...register('contact_info')}
                disabled={isPending}
              />
              <p className="text-xs text-gray-500">
                Plain text or JSON is fine—we store it exactly how you enter it.
              </p>
            </div>

            {mutationError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {mutationError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={isPending}
              >
                {isPending ? 'Saving…' : 'Save vendor'}
              </button>
              <p className="text-xs text-gray-500">
                We’ll immediately redirect you back to vendor settings.
              </p>
            </div>
          </form>
        </section>
      </div>
    </Page>
  )
}

export default CreateVendorPage
