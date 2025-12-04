import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import CollectibleEditForm from './CollectibleEditForm'

const mutateSpy = vi.fn().mockResolvedValue({})
const uploadSpy = vi.fn().mockResolvedValue('https://example.com/new-image.jpg')

vi.mock('../hooks/useUpdateCollectible', () => ({
  useUpdateCollectible: () => ({
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

describe('CollectibleEditForm', () => {
  it('submits updated values', async () => {
    const onSuccess = vi.fn()
    render(
      <CollectibleEditForm
        collectible={{
          id: 1,
          name: 'Sample',
          sku: 'SKU-1',
          quantity: 5,
        }}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated Name' } })
    const form = screen
      .getByRole('button', { name: /save changes/i })
      .closest('form') as HTMLFormElement
    fireEvent.submit(form)

    await waitFor(() => expect(mutateSpy).toHaveBeenCalled())
    expect(onSuccess).toHaveBeenCalled()
  })
})
