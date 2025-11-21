import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import CollectiblesListPage from './features/inventory/pages/CollectiblesListPage'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import VendorOverviewPage from './features/vendors/pages/VendorOverviewPage'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import { logout as logoutAction } from './features/auth/store/authSlice'
import type { RootState } from './store'

type View = 'inventory' | 'dashboard' | 'vendors' | 'login' | 'register'

export default function App() {
  const [view, setView] = useState<View>('inventory')
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const dispatch = useDispatch()

  function handleLogout() {
    dispatch(logoutAction())
    setView('inventory')
  }

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardPage />
      case 'vendors':
        return <VendorOverviewPage />
      case 'login':
        return <LoginPage onLoggedIn={() => setView('inventory')} />
      case 'register':
        return <RegisterPage onRegistered={() => setView('login')} />
      case 'inventory':
      default:
        return <CollectiblesListPage />
    }
  }

  return (
    <div className="space-y-4 p-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Omni-Stock (Frontend)</h1>
        <nav className="flex flex-wrap gap-2 text-sm">
          <button data-cy="nav-inventory" onClick={() => setView('inventory')} className="text-blue-600">Inventory</button>
          {isAuthenticated && (
            <>
              <button data-cy="nav-dashboard" onClick={() => setView('dashboard')} className="text-blue-600">Dashboard</button>
              <button data-cy="nav-vendors" onClick={() => setView('vendors')} className="text-blue-600">Vendors</button>
            </>
          )}
          <button data-cy="nav-register" onClick={() => setView('register')} className="text-blue-600">Register</button>
          <button data-cy="nav-login" onClick={() => setView('login')} className="text-blue-600">Login</button>
          {isAuthenticated && (
            <button data-cy="nav-logout" onClick={handleLogout} className="text-red-600">Logout</button>
          )}
        </nav>
      </header>

      <div>{renderContent()}</div>
    </div>
  )
}
