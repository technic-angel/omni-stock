import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Card from '../../../shared/components/Card'
import { useLogin } from '../hooks/useLogin'
import { LoginInput, loginSchema } from '../schema/authSchema'
import { useAuth } from '../hooks/useAuth'

const LoginPage = () => {
  const navigate = useNavigate()
  const { setAccessToken } = useAuth()
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
      setAccessToken(data.access)
      navigate('/inventory', { replace: true })
    } catch (err: any) {
      setServerError(err?.response?.data?.detail || err.message || 'Login failed')
    }
  }

  return (
    <Card title="Login">
      {serverError && <div className="text-red-600">{serverError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <label className="block">
          <div className="text-sm">Email or Username</div>
          <input
            data-cy="login-email"
            className="w-full rounded border p-2"
            {...register('username')}
          />
          {errors.username && <p className="text-xs text-red-600">{errors.username.message}</p>}
        </label>
        <label className="block">
          <div className="text-sm">Password</div>
          <input
            data-cy="login-password"
            type="password"
            className="w-full rounded border p-2"
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </label>
        <button
          data-cy="login-submit"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </Card>
  )
}

export default LoginPage
