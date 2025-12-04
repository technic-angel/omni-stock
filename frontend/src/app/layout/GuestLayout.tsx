import React from 'react'
import { Link, Outlet } from 'react-router-dom'

import { Button } from '../../components/ui/button'

/**
 * GuestLayout - Minimal layout for unauthenticated pages (login, register, etc.)
 *
 * 📚 LEARNING: Layout Components
 *
 * This component wraps auth pages with a consistent header and centers the content.
 * It uses <Outlet /> from React Router to render the child route's component.
 *
 * The pattern:
 * <Route element={<GuestLayout />}>
 *   <Route path="/login" element={<LoginPage />} />   <- Renders in <Outlet />
 *   <Route path="/register" element={<RegisterPage />} />
 * </Route>
 */
const GuestLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo - links back to landing */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/branding/omni-stock-logo-horizontal-gem-tiffany.svg"
              alt="Omni-Stock"
              className="h-10 w-auto"
            />
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="bg-brand-primary hover:bg-brand-primary-dark">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - centered */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </main>

      {/* Simple Footer */}
      <footer className="py-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Omni-Stock</p>
      </footer>
    </div>
  )
}

export default GuestLayout
