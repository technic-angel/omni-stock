import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Card from '../../../shared/components/Card'
import { useRegister } from '../hooks/useRegister'
import { RegisterInput, registerSchema } from '../schema/authSchema'

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
    defaultValues: { username: '', email: '', password: '' },
  })

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null)
    try {
      await mutateAsync(values)
      navigate('/login', { replace: true })
    } catch (err: any) {
      setServerError(err?.response?.data?.detail || err.message || 'Registration failed')
    }
  }

  return (
    <Card title="Register">
      {serverError && <div className="text-red-600">{serverError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <label className="block">
          <div className="text-sm">Username</div>
          <input data-cy="register-username" className="w-full rounded border p-2" {...register('username')} />
          {errors.username && <p className="text-xs text-red-600">{errors.username.message}</p>}
        </label>
        <label className="block">
          <div className="text-sm">Email</div>
          <input data-cy="register-email" type="email" className="w-full rounded border p-2" {...register('email')} />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </label>
        <label className="block">
          <div className="text-sm">Password</div>
          <input data-cy="register-password" type="password" className="w-full rounded border p-2" {...register('password')} />
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </label>
        <button
          data-cy="register-submit"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Creating…' : 'Register'}
        </button>
      </form>
    </Card>
  )
}

export default RegisterPage
