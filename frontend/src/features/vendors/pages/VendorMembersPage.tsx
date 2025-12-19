import { useForm } from 'react-hook-form'

import Page from '../../../shared/components/Page'
import VendorMembersCard from '../components/VendorMembersCard'
import { useInviteVendorMember } from '../hooks/useInviteVendorMember'
import type { VendorMemberRole } from '../api/vendorsApi'

type InviteFormValues = {
  email: string
  role: VendorMemberRole
}

const ROLE_OPTIONS: VendorMemberRole[] = ['admin', 'manager', 'member', 'staff', 'billing', 'viewer']

const VendorMembersPage = () => {
  const { mutateAsync: inviteMember, isPending } = useInviteVendorMember()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    defaultValues: { email: '', role: 'manager' },
  })

  const onSubmit = async (values: InviteFormValues) => {
    await inviteMember(values)
    reset()
  }

  return (
    <Page
      title="Members & Roles"
      subtitle="Invite teammates, manage permissions, and track membership status."
      dataCy="vendor-members-page"
    >
      <div className="grid gap-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Invite new member</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-[2fr,1fr,auto]" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Email
                <input
                  type="email"
                  className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                  placeholder="teammate@example.com"
                  {...register('email', { required: 'Email is required' })}
                />
              </label>
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Role
                <select
                  className="mt-1 w-full rounded border border-gray-300 p-2 text-sm capitalize"
                  {...register('role')}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={isPending}
              >
                {isPending ? 'Inviting…' : 'Invite'}
              </button>
            </div>
          </form>
        </section>
        <VendorMembersCard />
      </div>
    </Page>
  )
}

export default VendorMembersPage
