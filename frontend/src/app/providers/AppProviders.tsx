import { ReactNode, useState, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'

import { store } from '../../store'
import { clearCredentials } from '../../store/slices/authSlice'
import { setUnauthorizedHandler } from '../../shared/lib/http'
import AuthProvider from '../../features/auth/providers/AuthProvider'
import { routerFuture } from '../routes/routerFuture'

type Props = {
  children: ReactNode
}

const AppProviders = ({ children }: Props) => {
  const [queryClient] = useState(() => new QueryClient())

  // Set up the 401 handler to clear Redux state when token is invalid
  useEffect(() => {
    setUnauthorizedHandler(() => {
      store.dispatch(clearCredentials())
    })
  }, [])

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter future={routerFuture}>{children}</BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  )
}

export default AppProviders
