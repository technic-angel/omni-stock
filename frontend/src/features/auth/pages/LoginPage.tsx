import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'

import { useLogin } from '../hooks/useLogin'
import { LoginInput, loginSchema } from '../schema/authSchema'
import { useAppDispatch } from '../../../store/hooks'
import { setCredentials } from '../../../store/slices/authSlice'

type LocationState = {
  from?: {
    pathname: string
  }
}

/**
 * LoginPage - User login form
 *
 * 📚 Now using Redux for auth state!
 * Instead of useAuth() context, we dispatch(setCredentials(token))
 */
const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch() // Redux dispatch
  const { mutateAsync, isPending } = useLogin()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (values: LoginInput) => {
    setServerError(null)
    try {
      const data = await mutateAsync(values)
      // 📚 Redux: dispatch action to save token in store
      dispatch(setCredentials(data.access))
      // Redirect to where they were trying to go, or dashboard
      const state = location.state as LocationState | null
      const redirectTo = state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>
      setServerError(error.response?.data?.detail || error.message || 'Login failed')
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white rounded-lg shadow-lg border p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Login to Your Account</h1>

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
              Username or Email
            </label>
            <input
              id="username"
              data-cy="login-email"
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your username"
              {...register('username')}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              data-cy="login-password"
              type="password"
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            data-cy="login-submit"
            className="w-full rounded-lg bg-brand-primary hover:bg-brand-primary-dark px-4 py-3 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending}
          >
            {isPending ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        {/* Register Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link
            to="/register"
            className="text-brand-primary hover:text-brand-primary-dark font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
