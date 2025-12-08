import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'

import { useRegister } from '../hooks/useRegister'
import { useCheckEmail } from '../hooks/useCheckEmail'
import { RegisterInput, registerSchema } from '../schema/authSchema'
import { z } from 'zod'

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

  const { mutateAsync: checkEmail, isPending: isCheckingEmail } = useCheckEmail()
  const [step, setStep] = useState<'email' | 'details'>('email')
  const [checkedEmail, setCheckedEmail] = useState("")
  const [duplicateEmailError, setDuplicateEmailError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      confirmPassword: '',
      company_name: '',
      birthdate: '',
    },
  })

 
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<{ email: string }>({
    resolver: zodResolver(z.object({
      email: z.string().email("Please enter a valid email address"),
    })),
    defaultValues: { email: '' },
  })

  const onCheckEmail = async ({ email }: { email: string }) => {
    setDuplicateEmailError(null)
    try {
      const data = await checkEmail(email)
      if (data.available) {
        setCheckedEmail(email)
        setValue('email', email)
        setStep('details')
      } else {
        setDuplicateEmailError('This email is already registered. Please use a different email.')
      }
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>
      setDuplicateEmailError(error.response?.data?.detail || error.message || 'Failed to check email')
    }
  }

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null)
    try {
      await mutateAsync({ ...values, email: checkedEmail || values.email })
      // After registration, redirect to login
      navigate('/login', { replace: true })
    } catch (err) {
      // Handle specific field errors from the API
      const error = err as AxiosError<{
        detail?: string
        username?: string[]
        password?: string[]
        email?: string[]
      }>
      const errorData = error.response?.data
      if (errorData?.username) {
        setServerError(`Username: ${errorData.username[0]}`)
      } else if (errorData?.email) {
        setServerError(`Email: ${errorData.email[0]}`)
      } else {
        setServerError(errorData?.detail || error.message || 'Registration failed')
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

        { step === 'email' ? ( 
          <form onSubmit={handleSubmitEmail(onCheckEmail)} className="space-y-4">
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
                  emailErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
                {...registerEmail('email')}
              />
              {emailErrors.email && (
                <p className="mt-1 text-xs text-red-600">{emailErrors.email.message}</p>
              )}
              {duplicateEmailError && (
                <p className="mt-1 text-xs text-red-600">{duplicateEmailError}</p>
              )}
            </div>
            {/* Submit Continue */}
            <button
              type="submit"
              data-cy="check-email-submit"
              className="w-full rounded-lg bg-brand-primary hover:bg-brand-primary-dark px-4 py-3 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCheckingEmail}
            >
              {isCheckingEmail ? 'Checking…' : 'Continue'}
            </button>
          </form>

        ):(
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

          {/* Email Display (locked after step 1) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-700">
              {checkedEmail}
            </div>
            <input type="hidden" {...register('email')} />
          </div>
          {/* First Name Field */}
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              id="first_name"
              data-cy="register-first-name"
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.first_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your first name"
              {...register('first_name')}
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
            )}
          </div>
          {/* Last Name Field */}
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              id="last_name"
              data-cy="register-last-name"
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.last_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your last name"
              {...register('last_name')}
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
            )}
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

          {/* Company Name Field */}
          <div>
            <label
              htmlFor="company_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company / Vendor Name (optional)
            </label>
            <input
              id="company_name"
              data-cy="register-company-name"
              className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Acme Collectibles"
              {...register('company_name')}
            />
            {errors.company_name && (
              <p className="mt-1 text-xs text-red-600">{errors.company_name.message}</p>
            )}
          </div>

          {/* Birthdate Field */}
          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
              Birthdate
            </label>
            <input
              id="birthdate"
              data-cy="register-birthdate"
              type="date"
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.birthdate ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('birthdate')}
            />
            {errors.birthdate && (
              <p className="mt-1 text-xs text-red-600">{errors.birthdate.message}</p>
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
        )}

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
