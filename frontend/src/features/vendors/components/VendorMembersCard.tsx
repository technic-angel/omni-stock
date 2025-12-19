import Card from '../../../shared/components/Card'
import { useVendorMembers } from '../hooks/useVendorMembers'
import { useUpdateVendorMember } from '../hooks/useUpdateVendorMember'
import type { VendorMemberRole } from '../api/vendorsApi'

const ROLE_OPTIONS: VendorMemberRole[] = ['owner', 'admin', 'manager', 'member', 'staff', 'billing', 'viewer']

const VendorMembersCard = () => {
  const { data, isLoading, error } = useVendorMembers()
  const { mutateAsync: updateMember, isPending } = useUpdateVendorMember()

  const handleRoleChange = async (memberId: number, role: VendorMemberRole) => {
    await updateMember({ id: memberId, payload: { role } })
  }

  const handleDeactivate = async (memberId: number) => {
    await updateMember({ id: memberId, payload: { is_active: false } })
  }

  if (isLoading) {
    return (
      <Card title="Members">
        <p className="text-sm text-gray-500">Loading members…</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card title="Members">
        <p className="text-sm text-red-600">Failed to load members.</p>
      </Card>
    )
  }

  const members = data ?? []

  return (
    <Card title="Members">
      {members.length === 0 ? (
        <p className="text-sm text-gray-500">No members yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-t border-gray-100">
                  <td className="py-2">
                    <p className="font-medium">{member.email}</p>
                  </td>
                  <td className="py-2">
                    <select
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm capitalize"
                      value={member.role}
                      disabled={isPending}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as VendorMemberRole)}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <span className={`text-xs ${member.is_active ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {member.is_active && (
                      <button
                        type="button"
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        disabled={isPending}
                        onClick={() => handleDeactivate(member.id)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default VendorMembersCard
