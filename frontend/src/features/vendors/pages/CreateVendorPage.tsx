import React from 'react'
import Page from '../../../shared/components/Page'

const CreateVendorPage = () => {
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

          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="vendor-name" className="text-sm font-medium text-gray-700">
                Vendor name
              </label>
              <input
                id="vendor-name"
                type="text"
                placeholder="e.g. Tech Ship Inc"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
                disabled
              />
              <p className="text-xs text-gray-500">We’ll wire this input to Supabase once the mutation is connected.</p>
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
                disabled
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white opacity-50"
                disabled
              >
                Save vendor
              </button>
              <p className="text-xs text-gray-500">We’ll hook this action into the vendor creation mutation next.</p>
            </div>
          </form>
        </section>
      </div>
    </Page>
  )
}

export default CreateVendorPage
