import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'
const navLinkClass = (active: boolean) =>
  `text-blue-600 ${active ? 'font-semibold' : ''}`

const AppLayout = () => {
  const location = useLocation()
  const { isAuthenticated, logout } = useAuth()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="space-y-4 p-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Omni-Stock (Frontend)</h1>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link data-cy="nav-inventory" to="/inventory" className={navLinkClass(isActive('/inventory') || location.pathname === '/')}>
            Inventory
          </Link>
          {isAuthenticated && (
            <>
              <Link data-cy="nav-dashboard" to="/dashboard" className={navLinkClass(isActive('/dashboard'))}>
                Dashboard
              </Link>
              <Link data-cy="nav-vendors" to="/vendors" className={navLinkClass(isActive('/vendors'))}>
                Vendors
              </Link>
            </>
          )}
          <Link data-cy="nav-register" to="/register" className={navLinkClass(isActive('/register'))}>
            Register
          </Link>
          <Link data-cy="nav-login" to="/login" className={navLinkClass(isActive('/login'))}>
            Login
          </Link>
          {isAuthenticated && (
            <button data-cy="nav-logout" onClick={logout} className="text-red-600">
              Logout
            </button>
          )}
        </nav>
      </header>

      <div>
        <Outlet />
      </div>
    </div>
  )
}

export default AppLayout
