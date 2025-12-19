import React from 'react'
import { Route, Routes } from 'react-router-dom'

import AppLayout from '../layout/AppLayout'
import GuestLayout from '../layout/GuestLayout'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import NotFoundPage from './NotFoundPage'
import CollectiblesListPage from '../../features/inventory/pages/CollectiblesListPage'
import CollectibleEditPage from '../../features/inventory/pages/CollectibleEditPage'
import DashboardPage from '../../features/dashboard/pages/DashboardPage'
import VendorOverviewPage from '../../features/vendors/pages/VendorOverviewPage'
import CreateVendorPage from '../../features/vendors/pages/CreateVendorPage'
import CreateStorePage from '../../features/vendors/pages/CreateStorePage'
import StoreDetailPage from '../../features/vendors/pages/StoreDetailPage'
import VendorMembersPage from '../../features/vendors/pages/VendorMembersPage'
import SwitchVendorPage from '../../features/vendors/pages/SwitchVendorPage'
import SwitchStorePage from '../../features/vendors/pages/SwitchStorePage'
import SettingsPage from '../../features/settings/pages/SettingsPage'
import LoginPage from '../../features/auth/pages/LoginPage'
import RegisterPage from '../../features/auth/pages/RegisterPage'
import LogoutPage from '../../features/auth/pages/LogoutPage'
import LandingPage from '../../features/landing/pages/LandingPage'
import CompleteProfilePage from '../../features/auth/pages/CompleteProfilePage'
import { UserProfilePage } from '@/features/profile/UserProfilePage'

/**
 * AppRoutes - Main routing configuration
 *
 * 📚 LEARNING: Route Organization Pattern
 *
 * Routes are organized into three groups:
 * 1. Public landing page (standalone, no layout)
 * 2. Guest routes (GuestLayout) - Login, Register, Password Reset
 * 3. Protected routes (AppLayout) - Dashboard, Inventory, Profile
 *
 * PublicRoute: Redirects authenticated users AWAY (to /dashboard)
 * ProtectedRoute: Redirects unauthenticated users TO login
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public landing page - standalone layout */}
      <Route
        index
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />

      {/* Guest routes - minimal layout with centered content */}
      <Route
        element={
          <PublicRoute>
            <GuestLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Logout route - accessible to anyone, handles its own redirect */}
      <Route path="/logout" element={<LogoutPage />} />

      {/* Protected app routes - full app layout with sidebar */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<CollectiblesListPage />} />
        <Route path="/inventory/:collectibleId/edit" element={<CollectibleEditPage />} />
        <Route path="/vendors" element={<VendorOverviewPage />} />
        <Route path="/vendors/members" element={<VendorMembersPage />} />
        <Route path="/vendors/switch" element={<SwitchVendorPage />} />
        <Route path="/vendors/new" element={<CreateVendorPage />} />
        <Route path="/stores/new" element={<CreateStorePage />} />
        <Route path="/stores/:storeId" element={<StoreDetailPage />} />
        <Route path="/stores/switch" element={<SwitchStorePage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <CompleteProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
