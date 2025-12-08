'use client'

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useCurrentUser } from '../auth/hooks/useCurrentUser'
import { useUpdateProfile } from '@/features/auth/hooks/useUpdateProfile'

export function UserProfilePage() {
    const { data: user, isLoading } = useCurrentUser({ enabled: true })
    const {
        mutateAsync: updateProfile,
        isPending: isUpdating,
        error: updateError,
    } = useUpdateProfile()

    const [editMode, setEditMode] = useState(false)

    // Form state for profile edit (UI-only)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [company, setCompany] = useState('')
    const [role, setRole] = useState('')
    const [bio, setBio] = useState('')
    const [profilePreview, setProfilePreview] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name ?? '')
            setLastName(user.last_name ?? '')
            setPhone(user.phone_number ?? '')
            setCompany(user.company_name ?? '')
            setRole(user.role ?? '')
            setBio(user.profile?.bio ?? '')
            setProfilePreview(user.profile?.profile_picture ?? null)
        }
    }, [user])

    if (isLoading && !user) return <div>Loading user data…</div>

    async function handleProfileSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!user) return
        const payload = {
            username: user.username,
            first_name: firstName,
            last_name: lastName,
            phone_number: phone,
            company_name: company,
            birthdate: user.birthdate,
            bio,
            phone,
        }
        try {
            await updateProfile(payload)
            setEditMode(false)
        } catch {
            // errors surface via the hook's error state
        }
    }

    function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setProfilePreview(url)
    }

    // inputs are rendered as form fields for a consistent layout
    // when not editing they are disabled and visually muted
    const disabledAttrs = editMode ? {} : { disabled: true }

    // compute initials for placeholder avatar
    const initials = ((user?.first_name ?? '').trim().charAt(0) || (user?.username ?? '').charAt(0) || '') +
        ((user?.last_name ?? '').trim().charAt(0) || '')

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold mb-4">Profile</h1>
                <div>
                    <button
                        onClick={() => setEditMode((s) => !s)}
                        className="ml-2 inline-flex items-center gap-2 rounded bg-slate-800 px-3 py-1 text-sm text-white"
                    >
                        {editMode ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
            </div>

            {user ? (
                <div className="space-y-6">
                    <form onSubmit={handleProfileSubmit} className={`space-y-6 ${!editMode ? 'opacity-60 pointer-events-auto' : ''}`}>
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-xl font-semibold text-white" style={{ background: profilePreview ? 'transparent' : 'linear-gradient(135deg,#06b6d4,#7c3aed)' }}>
                                {profilePreview ? (
                                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                                    <img src={profilePreview} alt="Profile image" className="h-full w-full object-cover" />
                                ) : (
                                    // placeholder initials
                                    <span>{initials || 'U'}</span>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="text-lg font-medium">{user.full_name ?? `${user.first_name ?? ''} ${user.last_name ?? ''}`}</div>
                                <div className="text-sm text-gray-500">{user.role ?? ''}{user.company_name ? ` · ${user.company_name}` : ''}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input
                                    readOnly
                                    value={user.username}
                                    className="mt-1 block w-full rounded border px-3 py-2 bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    readOnly
                                    value={user.email}
                                    className="mt-1 block w-full rounded border px-3 py-2 bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Birthdate</label>
                                <input
                                    readOnly
                                    value={user.birthdate ?? ''}
                                    className="mt-1 block w-full rounded border px-3 py-2 bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First name</label>
                                <input
                                    {...disabledAttrs}
                                    aria-label="First name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="mt-1 block w-full rounded border px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last name</label>
                                <input
                                    {...disabledAttrs}
                                    aria-label="Last name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="mt-1 block w-full rounded border px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone number</label>
                                <input
                                    {...disabledAttrs}
                                    aria-label="Phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="mt-1 block w-full rounded border px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Company</label>
                                <input
                                    {...disabledAttrs}
                                    aria-label="Company"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="mt-1 block w-full rounded border px-3 py-2"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <input
                                {...disabledAttrs}
                                aria-label="Role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="mt-1 block w-full rounded border px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Short bio</label>
                            <textarea
                                {...disabledAttrs}
                                aria-label="Short bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="mt-1 block w-full rounded border px-3 py-2"
                                rows={4}
                            />
                            <p className="text-xs text-gray-400">A short (1-2 sentence) bio shown on your profile.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Profile picture (preview)</label>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-100">
                                    {profilePreview ? (
                                        // eslint-disable-next-line jsx-a11y/img-redundant-alt
                                        <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    disabled
                                    aria-label="Profile picture upload (coming soon)"
                                    className="cursor-not-allowed text-gray-400"
                                />
                            </div>
                        </div>

                        {updateError && (
                            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                Failed to update profile. Please try again.
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed" disabled={!editMode || isUpdating} aria-disabled={!editMode || isUpdating}>
                                {isUpdating ? 'Saving…' : 'Save Profile'}
                            </button>
                            <button type="button" onClick={() => setEditMode(false)} className="rounded border px-4 py-2" aria-label="Cancel edit">
                                Cancel
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <Link to="/dashboard" className="text-sm text-primary">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            ) : (
                <div>User not found</div>
            )}
        </div>
    )
}
