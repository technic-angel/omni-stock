import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useCompleteProfile } from './useCompleteProfile'
import { completeProfile } from '../api/authApi'

vi.mock('../api/authApi', () => ({
  completeProfile: vi.fn(),
}))

describe('useCompleteProfile', () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('calls completeProfile with provided payload', async () => {
    const payload = { username: 'user', password: 'secret' }
    vi.mocked(completeProfile).mockResolvedValue({ id: 1 } as any)

    const { result } = renderHook(() => useCompleteProfile(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(payload)
    })

    expect(completeProfile).toHaveBeenCalledWith(payload)
  })
})
