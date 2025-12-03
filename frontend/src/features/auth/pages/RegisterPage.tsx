import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useRegister } from '../hooks/useRegister'
import { RegisterInput, registerSchema } from '../schema/authSchema'

/**
 * RegisterPage - New user registration form
 *
 * 📚 LEARNING: Same pattern as LoginPage
 *
 * The form handling pattern is identical:
 * 1. Zod schema (registerSchema) - adds email validation
 * 2. useForm with zodResolver
 * 3. useMutation for API call
 * 4. Redirect on success
 */
const RegisterPage = () => {
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useRegister()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null)
    try {
      await mutateAsync(values)
      // After registration, redirect to login
      navigate('/login', { replace: true })
    } catch (err: any) {
      // Handle specific field errors from the API
      const errorData = err?.response?.data
      if (errorData?.username) {
        setServerError(`Username: ${errorData.username[0]}`)
      } else if (errorData?.email) {
        setServerError(`Email: ${errorData.email[0]}`)
      } else {
        setServerError(errorData?.detail || err.message || 'Registration failed')
      }
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white rounded-lg shadow-lg border p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Create Account</h1>

        {/* Server Error */}
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              data-cy="register-username"
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

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              data-cy="register-email"
              type="email"
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              data-cy="register-password"
              type="password"
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="At least 8 characters"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              data-cy="register-confirm-password"
              type="password"
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Re-enter your password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            data-cy="register-submit"
            className="w-full rounded-lg bg-brand-primary hover:bg-brand-primary-dark px-4 py-3 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending}
          >
            {isPending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-brand-primary hover:text-brand-primary-dark font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
