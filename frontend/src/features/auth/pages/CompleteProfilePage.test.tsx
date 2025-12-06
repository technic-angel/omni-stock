import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import CompleteProfilePage from './CompleteProfilePage'
import authReducer from '@/store/slices/authSlice'
import { routerFuture } from '@/app/routes/routerFuture'
import { useCompleteProfile } from '../hooks/useCompleteProfile'
import { useCurrentUser } from '../hooks/useCurrentUser'

vi.mock('../hooks/useCompleteProfile')
vi.mock('../hooks/useCurrentUser')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderPage = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter future={routerFuture}>
          <CompleteProfilePage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  )
}

describe('CompleteProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCompleteProfile).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
  })

  it('locks pre-filled fields and shows email read-only', async () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      data: {
        username: 'melissa',
        email: 'melissa@example.com',
        birthdate: '1990-01-01',
        company_name: 'Omni Stock',
      },
      isLoading: false,
    } as any)

    renderPage()

    const usernameInput = await screen.findByLabelText('Username')
    expect(usernameInput).toHaveValue('melissa')
    expect(usernameInput).toHaveAttribute('readonly')
    expect(usernameInput).toHaveClass('bg-gray-100')

    const birthdateInput = screen.getByLabelText('Birthdate') as HTMLInputElement
    expect(birthdateInput).toHaveValue('1990-01-01')
    expect(birthdateInput).toHaveAttribute('readonly')

    const companyInput = screen.getByLabelText('Company / Vendor Name (optional)')
    expect(companyInput).toHaveValue('Omni Stock')
    expect(companyInput).toHaveAttribute('readonly')

    const emailInput = screen.getByDisplayValue('melissa@example.com')
    expect(emailInput).toHaveAttribute('readonly')
  })

  it('keeps fields editable when data missing', async () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      data: {
        username: '',
        email: 'user@example.com',
        birthdate: '',
        company_name: '',
      },
      isLoading: false,
    } as any)

    renderPage()

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).not.toHaveAttribute('readonly')
    })
    expect(screen.getByLabelText('Birthdate')).not.toHaveAttribute('readonly')
    expect(screen.getByLabelText('Company / Vendor Name (optional)')).not.toHaveAttribute('readonly')
  })
})
