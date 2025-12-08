import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useRegister } from './useRegister'
import * as authApi from '../api/authApi'

vi.mock('../api/authApi', () => ({
  register: vi.fn(),
}))

describe('useRegister', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  const basePayload = {
    username: 'melissa',
    email: 'melissa@example.com',
    first_name: 'Melissa',
    last_name: 'Berumen',
    password: 'ComplexPass123!',
    confirmPassword: 'ComplexPass123!',
    birthdate: '1990-01-01',
  }

  it('sends trimmed company name to the API', async () => {
    vi.mocked(authApi.register).mockResolvedValue({ id: 1, username: 'melissa' })

    const { result } = renderHook(() => useRegister(), { wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync({ ...basePayload, company_name: '   Omni Stock  ' })
    })

    expect(authApi.register).toHaveBeenCalledWith('melissa', 'melissa@example.com', 'Melissa', 'Berumen', 'ComplexPass123!', '1990-01-01', 'Omni Stock')
  })

  it('omits company name when blank', async () => {
    vi.mocked(authApi.register).mockResolvedValue({ id: 1, username: 'melissa' })

    const { result } = renderHook(() => useRegister(), { wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync({ ...basePayload, company_name: '' })
    })

    expect(authApi.register).toHaveBeenCalledWith('melissa', 'melissa@example.com', 'Melissa', 'Berumen', 'ComplexPass123!', '1990-01-01', undefined)
  })

  it('passes first and last name through to the API', async () => {
    vi.mocked(authApi.register).mockResolvedValue({ id: 1, username: 'melissa' })

    const { result } = renderHook(() => useRegister(), { wrapper })

    await result.current.mutateAsync({
      ...basePayload,
      first_name: '  Melissa  ',
      last_name: '  Tester ',
    })

    expect(authApi.register).toHaveBeenCalledWith(
      'melissa',
      'melissa@example.com',
      '  Melissa  ',
      '  Tester ',
      'ComplexPass123!',
      '1990-01-01',
      undefined,
    )
  })
})
