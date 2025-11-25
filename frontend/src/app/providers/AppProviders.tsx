import { ReactNode, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

import AuthProvider from '../../features/auth/providers/AuthProvider'

type Props = {
  children: ReactNode
}

const AppProviders = ({ children }: Props) => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
            return error.status >= 500
          }
          return failureCount < 3
        },
      },
    },
  }))

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            {children}
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
        {/* React Query DevTools - only shows in development */}
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default AppProviders
