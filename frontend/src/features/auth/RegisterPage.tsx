import React, { useState } from 'react'
import { register } from '../../api/auth'

export default function RegisterPage({ onRegistered }: { onRegistered: () => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await register(username, email, password)
      onRegistered()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Registration failed')
    }
  }

  return (
    <div className="p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-2">Register</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">
          <div className="text-sm">Username</div>
          <input data-cy="register-username" className="w-full border p-2" value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <label className="block mb-2">
          <div className="text-sm">Email</div>
          <input data-cy="register-email" type="email" className="w-full border p-2" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="block mb-4">
          <div className="text-sm">Password</div>
          <input data-cy="register-password" type="password" className="w-full border p-2" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <button data-cy="register-submit" className="px-4 py-2 bg-blue-600 text-white rounded">Register</button>
      </form>
    </div>
  )
}
