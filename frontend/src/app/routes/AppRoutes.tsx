import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from '../layout/AppLayout'
import ProtectedRoute from './ProtectedRoute'
import NotFoundPage from './NotFoundPage'
import CollectiblesListPage from '../../features/inventory/pages/CollectiblesListPage'
import CollectibleEditPage from '../../features/inventory/pages/CollectibleEditPage'
import DashboardPage from '../../features/dashboard/pages/DashboardPage'
import VendorOverviewPage from '../../features/vendors/pages/VendorOverviewPage'
import LoginPage from '../../features/auth/pages/LoginPage'
import RegisterPage from '../../features/auth/pages/RegisterPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<CollectiblesListPage />} />
        <Route path="/inventory" element={<CollectiblesListPage />} />
        <Route
          path="/inventory/:collectibleId/edit"
          element={(
            <ProtectedRoute>
              <CollectibleEditPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/vendors"
          element={(
            <ProtectedRoute>
              <VendorOverviewPage />
            </ProtectedRoute>
          )}
        />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
