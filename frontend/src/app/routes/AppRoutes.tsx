import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from '../layout/AppLayout'
import CollectiblesListPage from '../../features/inventory/pages/CollectiblesListPage'
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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vendors" element={<VendorOverviewPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/inventory" replace />} />
    </Routes>
  )
}

export default AppRoutes
