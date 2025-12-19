import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import CollectibleEditForm from './CollectibleEditForm'

type CollectibleProp = React.ComponentProps<typeof CollectibleEditForm>['collectible']

const mutateSpy = vi.fn()
const uploadSpy = vi.fn()
const resetUploadErrorSpy = vi.fn()

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
    resetError: resetUploadErrorSpy,
  }),
}))

const renderForm = (collectibleOverrides: Partial<CollectibleProp> = {}) =>
  render(
    <CollectibleEditForm
      collectible={{
        id: 1,
        name: 'Sample',
        sku: 'SKU-1',
        quantity: 5,
        ...collectibleOverrides,
      }}
      onSuccess={vi.fn()}
    />,
  )

describe('CollectibleEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutateSpy.mockResolvedValue(undefined)
    uploadSpy.mockResolvedValue('https://example.com/new-image.jpg')
  })

  it('submits updated values', async () => {
    renderForm()

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated Name' } })
    const form = screen.getByRole('button', { name: /save changes/i }).closest('form') as HTMLFormElement
    fireEvent.submit(form)

    await waitFor(() =>
      expect(mutateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
        }),
      ),
    )
  })

  it('uploads a new file before saving', async () => {
    renderForm({ image_url: 'https://cdn.old-image.png' })

    const file = new File(['img'], 'cover.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/replace image/i), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(uploadSpy).toHaveBeenCalledWith(file))
    expect(mutateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        image_url: 'https://example.com/new-image.jpg',
      }),
    )
    expect(resetUploadErrorSpy).toHaveBeenCalled()
  })

  it('stops submission when upload fails', async () => {
    uploadSpy.mockRejectedValueOnce(new Error('upload failed'))
    renderForm()

    const file = new File(['img'], 'cover.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/replace image/i), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(uploadSpy).toHaveBeenCalled())
    expect(mutateSpy).not.toHaveBeenCalled()
  })

  it('falls back to existing URL when no file provided', async () => {
    renderForm({ image_url: 'https://cdn.current.png' })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(mutateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          image_url: 'https://cdn.current.png',
        }),
      ),
    )
  })
})
