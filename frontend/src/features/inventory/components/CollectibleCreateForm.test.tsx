import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import CollectibleCreateForm from './CollectibleCreateForm'

vi.mock('../hooks/useCreateCollectible', () => {
  return {
    useCreateCollectible: () => ({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    }),
  }
})

describe('CollectibleCreateForm', () => {
  it('submits with required fields', async () => {
    const onCreated = vi.fn()
    render(<CollectibleCreateForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Item' } })
    fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'SKU-1' } })
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '1' } })

    fireEvent.submit(screen.getByRole('button', { name: /create/i }))
    await screen.findByRole('button', { name: /create/i })

    expect(onCreated).toHaveBeenCalled()
  })
})
