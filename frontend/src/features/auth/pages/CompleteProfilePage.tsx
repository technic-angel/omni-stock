import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'

import { useCompleteProfile } from '../hooks/useCompleteProfile'
import { completeProfileSchema, type CompleteProfileInput } from '../schema/completeProfileSchema'
import { useAppDispatch } from '@/store/hooks'
import { setProfileComplete } from '@/store/slices/authSlice'
import { useCurrentUser } from '../hooks/useCurrentUser'

const CompleteProfilePage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useCompleteProfile()
  const [serverError, setServerError] = useState<string | null>(null)
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { username: '', password: '', birthdate: '', company_name: '' },
  })

  useEffect(() => {
    if (currentUser) {
      reset({
        username: currentUser.username ?? '',
        password: '',
        birthdate: currentUser.birthdate ?? '',
        company_name: currentUser.company_name ?? '',
      })
    }
  }, [currentUser, reset])

  const lockedFields = useMemo(
    () => ({
      username: Boolean(currentUser?.username),
      birthdate: Boolean(currentUser?.birthdate),
      company_name: Boolean(currentUser?.company_name),
    }),
    [currentUser],
  )

  const getInputClasses = (hasError: boolean, locked?: boolean) =>
    [
      'w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
      hasError ? 'border-red-500' : 'border-gray-300',
      locked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : '',
    ]
      .filter(Boolean)
      .join(' ')

  const onSubmit = async (values: CompleteProfileInput) => {
    setServerError(null)
    try {
      await mutateAsync({
        username: values.username,
        password: values.password,
        birthdate: values.birthdate,
        company_name: values.company_name || null,
      })
      dispatch(setProfileComplete(true))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const error = err as AxiosError<{ detail?: string; username?: string[] }>
      const errorData = error.response?.data
      if (errorData?.username) {
        setServerError(`Username: ${errorData.username[0]}`)
      } else {
        setServerError(errorData?.detail || error.message || 'Profile completion failed')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-brand-primary w-full">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4 sm:px-8">
          <Link to="/" className="inline-flex items-center space-x-3">
            <img
              src="/branding/omni-stock-logo-horizontal-gem-tiffany.svg"
              alt="Omni-Stock"
              className="h-8"
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4">
        <div className="mx-auto mt-8 max-w-xl bg-white rounded-lg shadow-lg border p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">Complete Your Profile</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Finish setting up your account to unlock the rest of the app.
        </p>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={currentUser?.email ?? ''}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-100 p-3 text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              className={getInputClasses(Boolean(errors.username), lockedFields.username)}
              readOnly={lockedFields.username}
              placeholder="Choose a username"
              {...register('username')}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={getInputClasses(Boolean(errors.password))}
              placeholder="Add a secure password"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
              Birthdate
            </label>
            <input
              id="birthdate"
              type="date"
              className={getInputClasses(Boolean(errors.birthdate), lockedFields.birthdate)}
              readOnly={lockedFields.birthdate}
              {...register('birthdate')}
            />
            {errors.birthdate && (
              <p className="mt-1 text-xs text-red-600">{errors.birthdate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
              Company / Vendor Name (optional)
            </label>
            <input
              id="company_name"
              className={getInputClasses(Boolean(errors.company_name), lockedFields.company_name)}
              readOnly={lockedFields.company_name}
              placeholder="Acme Collectibles"
              {...register('company_name')}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-brand-primary hover:bg-brand-primary-dark px-4 py-3 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending || isUserLoading}
          >
            {isPending ? 'Saving…' : 'Finish Setup'}
          </button>
        </form>
        </div>
      </main>
    </div>
  )
}

export default CompleteProfilePage
