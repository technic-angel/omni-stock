import React from 'react'

import AppProviders from './app/providers/AppProviders'
import AppRoutes from './app/routes/AppRoutes'

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}
