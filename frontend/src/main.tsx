import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

function Root() {
  return (
    <Provider store={{} as any}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
