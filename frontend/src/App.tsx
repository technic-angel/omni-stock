import React, { useState } from 'react'
import CollectiblesList from './features/collectibles/CollectiblesList'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from './store'
import { logout as logoutAction } from './features/auth/authSlice'

export default function App() {
  const [view, setView] = useState<'home' | 'login' | 'register'>('home')
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const dispatch = useDispatch()

  function handleLogout() {
    dispatch(logoutAction())
    setView('home')
  }

  return (
    <div className="p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Omni-Stock (Frontend)</h1>
        <nav className="space-x-4">
          <button data-cy="nav-register" onClick={() => setView('register')} className="text-sm text-blue-600">Register</button>
          <button data-cy="nav-login" onClick={() => setView('login')} className="text-sm text-blue-600">Login</button>
          {isAuthenticated ? (
            <button data-cy="nav-logout" onClick={handleLogout} className="text-sm text-red-600">Logout</button>
          ) : (
            <button data-cy="nav-logout" className="text-sm text-gray-400 hidden">Logout</button>
          )}
        </nav>
      </header>

      <p className="mt-4">Welcome — frontend scaffolded. Next: collectibles list and auth.</p>

      <div className="mt-6">
        {view === 'home' && <CollectiblesList />}
        {view === 'login' && <LoginPage onLoggedIn={() => setView('home')} />}
        {view === 'register' && <RegisterPage onRegistered={() => setView('login')} />}
      </div>
    </div>
  )
}
