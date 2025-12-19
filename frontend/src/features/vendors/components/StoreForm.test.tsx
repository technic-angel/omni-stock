import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import StoreForm from './StoreForm'
import { useCreateStore } from '../hooks/useCreateStore'

vi.mock('../hooks/useCreateStore', () => ({
  useCreateStore: vi.fn(),
}))

const mockUseCreateStore = vi.mocked(useCreateStore)

describe('StoreForm', () => {
  it('submits values and resets form', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    mockUseCreateStore.mockReturnValue({ mutateAsync, isPending: false } as any)
    const onCreated = vi.fn()

    render(<StoreForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText(/store name/i), { target: { value: 'Flagship' } })
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Main shop' } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Lane' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        name: 'Flagship',
        description: 'Main shop',
        address: '123 Lane',
      }),
    )
    await waitFor(() => expect(onCreated).toHaveBeenCalled())
  })

  it('disables button while pending', () => {
    mockUseCreateStore.mockReturnValue({ mutateAsync: vi.fn(), isPending: true } as any)
    render(<StoreForm />)
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })
})
