import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import CollectibleCreateForm from './CollectibleCreateForm'

const mutateSpy = vi.fn().mockResolvedValue({})
const uploadSpy = vi.fn().mockResolvedValue('https://example.com/image.jpg')

vi.mock('../hooks/useCreateCollectible', () => ({
  useCreateCollectible: () => ({
    mutateAsync: mutateSpy,
    isPending: false,
  }),
}))
vi.mock('../hooks/useCollectibleImageUpload', () => ({
  useCollectibleImageUpload: () => ({
    upload: uploadSpy,
    isUploading: false,
    error: null,
    resetError: vi.fn(),
  }),
}))

describe('CollectibleCreateForm', () => {
  it('submits with variants and required fields', async () => {
    const onCreated = vi.fn()
    render(<CollectibleCreateForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Item' } })
    fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'SKU-1' } })
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: 1 } })
    fireEvent.click(screen.getByRole('button', { name: /add variant/i }))
    fireEvent.change(screen.getByLabelText('Variant 1 Condition'), { target: { value: 'Raw' } })
    fireEvent.change(screen.getByLabelText('Variant 1 Grade'), { target: { value: 'PSA 10' } })
    fireEvent.change(screen.getByLabelText('Variant 1 Quantity'), { target: { value: 1 } })
    fireEvent.change(screen.getByLabelText('Variant 1 Price Adjustment'), {
      target: { value: '50.00' },
    })
    const file = new File(['data'], 'image.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Image'), { target: { files: [file] } })

    const form = screen.getByRole('button', { name: /create/i }).closest('form') as HTMLFormElement
    fireEvent.submit(form)
    await waitFor(() => expect(mutateSpy).toHaveBeenCalled(), { timeout: 2000 })
    expect(onCreated).toHaveBeenCalled()
    expect(uploadSpy).toHaveBeenCalled()
    expect(mutateSpy).toHaveBeenCalledWith(
    expect.objectContaining({
        variant_payloads: [
          {
            condition: 'Raw',
            grade: 'PSA 10',
            quantity: 1,
            price_adjustment: '50.00',
          },
        ],
      }),
    )
  })
})
