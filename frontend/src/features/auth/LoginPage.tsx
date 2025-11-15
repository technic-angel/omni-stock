import React, { useState } from 'react'
import { login } from '../../api/auth'
import { useDispatch } from 'react-redux'
import { setAccessToken } from './authSlice'

export default function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const dispatch = useDispatch()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const data = await login(username, password)
      // store token in Redux
      dispatch(setAccessToken(data.access))
      onLoggedIn()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Login failed')
    }
  }

  return (
    <div className="p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-2">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">
          <div className="text-sm">Email or Username</div>
          <input data-cy="login-email" className="w-full border p-2" value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <label className="block mb-4">
          <div className="text-sm">Password</div>
          <input data-cy="login-password" type="password" className="w-full border p-2" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <button data-cy="login-submit" className="px-4 py-2 bg-blue-600 text-white rounded">Login</button>
      </form>
    </div>
  )
}
