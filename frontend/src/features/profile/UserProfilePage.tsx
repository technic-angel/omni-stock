'use client'

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useCurrentUser } from '../auth/hooks/useCurrentUser'
import { useUpdateProfile } from '@/features/auth/hooks/useUpdateProfile'
import { uploadImageToSupabase, validateImageFile, isSupabaseConfigured, SUPABASE_BUCKET } from '@/shared/lib/supabase'
import { UserMediaPayload } from '@/features/auth/api/authApi'


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

    // Avatar upload handling state
    const [pendingAvatar, setPendingAvatar] = useState<UserMediaPayload | null>(null)
    const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name ?? '')
            setLastName(user.last_name ?? '')
            setPhone(user.phone_number ?? '')
            setCompany(user.company_name ?? '')
            setRole(user.role ?? '')
            setBio(user.profile?.bio ?? '')
            setProfilePreview(user.profile?.profile_picture ?? null)
            setPendingAvatar(null)
            setPendingAvatarUrl(user.profile?.profile_picture ?? null)
        } else {
            setPendingAvatar(null)
            setPendingAvatarUrl(null)
        }
    }, [user])

    if (isLoading && !user) return <div>Loading user data…</div>

    async function handleProfileSubmit(e: React.FormEvent) {
        e.preventDefault()
        // Form never renders without a user object; guard keeps TypeScript happy.
        /* c8 ignore next 2 */
        if (!user) return
        const shouldDeleteAvatar =
            pendingAvatarUrl === null &&
            !!user.profile?.profile_picture

        const payload = {
            username: user.username,
            first_name: firstName,
            last_name: lastName,
            phone_number: phone,
            company_name: company,
            birthdate: user.birthdate,
            bio,
            phone,
            profile_picture_url: pendingAvatarUrl,
            avatar: pendingAvatar,
            delete_profile_picture: shouldDeleteAvatar || undefined,
        }
        try {
            await updateProfile(payload)
            setEditMode(false)
        } catch {
            // errors surface via the hook's error state
        }
    }

    // inputs are rendered as form fields for a consistent layout
    // when not editing they are disabled and visually muted
    const disabledAttrs = editMode ? {} : { disabled: true }

    // compute initials for placeholder avatar
    const initials = ((user?.first_name ?? '').trim().charAt(0) || (user?.username ?? '').charAt(0) || '') +
        ((user?.last_name ?? '').trim().charAt(0) || '')

    //file upload to supabase handler
    async function handleAvatarFile(file?: File | null) {
        if (!file) return

        if (!isSupabaseConfigured()) {
            setAvatarUploadError('Supabase environment variables are missing')
            return
        }
        try {
            setIsUploadingAvatar(true)
            setAvatarUploadError(null)
            validateImageFile(file)

            const uploadUrl = await uploadImageToSupabase(file, `profile-avatars/${user?.id ?? 'anon'}`)
            const bitmap = await createImageBitmap(file)
            const objectPath = uploadUrl.split(`${SUPABASE_BUCKET}/`).pop() ?? ''
            const metadata = {
                bucket: SUPABASE_BUCKET,
                path: objectPath,
            }
            setPendingAvatar({
                media_type: 'profile_avatar',
                url: uploadUrl,
                width: bitmap.width,
                height: bitmap.height,
                size_kb: Math.round(file.size / 1024),
                metadata,
            })
            setPendingAvatarUrl(uploadUrl)
            setProfilePreview(uploadUrl)
        } catch (error) {
            setAvatarUploadError(error instanceof Error ? error.message : 'Failed to upload image')
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const avatarMetadataSummary = pendingAvatar
        ? `Metadata: ${pendingAvatar.width ?? '—'}×${pendingAvatar.height ?? '—'} px · ${pendingAvatar.size_kb ?? '—'} KB`
        : null

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
                            <div className="h-20 w-20 aspect-square flex-shrink-0 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-xl font-semibold text-white" style={{ background: profilePreview ? 'transparent' : 'linear-gradient(135deg,#06b6d4,#7c3aed)' }}>
                                {profilePreview ? (
                                    <img
                                        src={profilePreview}
                                        alt="Profile image"
                                        className="h-full w-full rounded-full object-cover object-center"
                                    />
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
                                    <img
                                        src={profilePreview}
                                        alt="Profile preview"
                                        className="h-16 w-16 aspect-square rounded-full object-cover object-center"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>
                                )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    aria-label="Profile picture upload"
                                    disabled={!editMode || isUploadingAvatar}
                                    onChange={(event) => {
                                        const file = event.target.files?.[0]
                                        void handleAvatarFile(file)
                                        event.target.value = ''
                                    }}
                                    className={`${!editMode ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer text-gray-700'}`}
                                />
                                {isUploadingAvatar && <p className="text-sm text-gray-500">Uploading…</p>}
                                {!isUploadingAvatar && pendingAvatarUrl && (
                                    <p className="text-sm text-emerald-600">Upload ready. Save to apply.</p>
                                )}
                                {avatarMetadataSummary && (
                                    <p className="text-xs text-gray-500">{avatarMetadataSummary}</p>
                                )}
                                {avatarUploadError && <p className="text-sm text-red-600">{avatarUploadError}</p>}
                                {editMode && !isUploadingAvatar && (
                                    <p className="text-xs text-gray-500">
                                        JPEG, PNG, WEBP, or GIF up to 2MB. Images are uploaded to Supabase for hosting.
                                    </p>
                                )}
                                {editMode && profilePreview && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    'Remove your profile photo? This cannot be undone.',
                                                )
                                            ) {
                                                setPendingAvatar(null)
                                                setPendingAvatarUrl(null)
                                                setProfilePreview(null)
                                            }
                                        }}
                                        className="text-xs text-red-600 underline"
                                    >
                                        Remove photo
                                    </button>
                                )}
                            </div>
                        </div>

                        {updateError && (
                            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                Failed to update profile. Please try again.
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!editMode || isUploadingAvatar || isUpdating}
                                aria-disabled={!editMode || isUploadingAvatar || isUpdating}
                            >
                                {isUpdating ? 'Saving…' : 'Save Profile'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditMode(false)
                                    setAvatarUploadError(null)
                                    setIsUploadingAvatar(false)
                                    setPendingAvatar(null)
                                    setPendingAvatarUrl(user?.profile?.profile_picture ?? null)
                                    setProfilePreview(user?.profile?.profile_picture ?? null)
                                }}
                                className="rounded border px-4 py-2"
                                aria-label="Cancel edit"
                            >
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
