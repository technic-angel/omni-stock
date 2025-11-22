import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import VendorForm from './VendorForm'

vi.mock('../hooks/useCreateVendor', () => {
  return {
    useCreateVendor: () => ({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    }),
  }
})

describe('VendorForm', () => {
  it('submits vendor creation', async () => {
    const onCreated = vi.fn()
    render(<VendorForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Vendor X' } })
    fireEvent.submit(screen.getByRole('button', { name: /create/i }))

    await screen.findByRole('button', { name: /create/i })
    expect(onCreated).toHaveBeenCalled()
  })
})
