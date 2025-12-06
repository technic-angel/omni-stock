import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'

import { useCompleteProfile } from '../hooks/useCompleteProfile'
import { completeProfileSchema, type CompleteProfileInput } from '../schema/completeProfileSchema'
import { useAppDispatch } from '@/store/hooks'
import { setProfileComplete } from '@/store/slices/authSlice'

const CompleteProfilePage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useCompleteProfile()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { username: '', password: '', company_name: '' },
  })

  const onSubmit = async (values: CompleteProfileInput) => {
    setServerError(null)
    try {
      await mutateAsync({
        username: values.username,
        password: values.password,
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
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg border p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Complete Your Profile</h1>
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
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
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
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Add a secure password"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
              Company / Vendor Name (optional)
            </label>
            <input
              id="company_name"
              className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Acme Collectibles"
              {...register('company_name')}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-brand-primary hover:bg-brand-primary-dark px-4 py-3 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending}
          >
            {isPending ? 'Saving…' : 'Finish Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CompleteProfilePage
