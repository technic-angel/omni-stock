import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { uploadImageToSupabase, isSupabaseConfigured } from '@/shared/lib/supabase'

import CollectibleEditForm from './CollectibleEditForm'

type CollectibleProp = React.ComponentProps<typeof CollectibleEditForm>['collectible']

const mutateSpy = vi.fn()
const uploadImageSpy = vi.fn()

vi.mock('../hooks/useUpdateCollectible', () => ({
  useUpdateCollectible: () => ({
    mutateAsync: mutateSpy,
    isPending: false,
  }),
}))

vi.mock('../hooks/useCollectibleImageUpload', () => ({
  useCollectibleImageUpload: () => ({
    upload: vi.fn(),
    isUploading: false,
    error: null,
    resetError: vi.fn(),
  }),
}))

vi.mock('@/shared/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/supabase')>()
  return {
    ...actual,
    isSupabaseConfigured: vi.fn(),
    uploadImageToSupabase: vi.fn(),
  }
})

const renderForm = (collectibleOverrides: Partial<CollectibleProp> = {}) =>
  render(
    <CollectibleEditForm
      collectible={{
        id: 1,
        name: 'Sample',
        sku: 'SKU-1',
        quantity: 5,
        variants: [],
        ...collectibleOverrides,
      }}
      onSuccess={vi.fn()}
    />,
  )

describe('CollectibleEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutateSpy.mockResolvedValue(undefined)
    uploadImageSpy.mockResolvedValue('https://example.com/new-image.jpg')
    
    // Default mocks
    vi.mocked(isSupabaseConfigured).mockReturnValue(true)
    vi.mocked(uploadImageToSupabase).mockImplementation(uploadImageSpy)
    
    // Mock createImageBitmap (browser API missing in JSDOM)
    global.createImageBitmap = vi.fn().mockResolvedValue({ width: 100, height: 100, close: vi.fn() }) as any
  })

  afterEach(() => {
    // optional cleanup
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
    fireEvent.change(screen.getByLabelText(/click to upload/i), { target: { files: [file] } })

    // Wait for upload to complete
    await waitFor(() => expect(uploadImageSpy).toHaveBeenCalledWith(file, expect.stringContaining('inventory-items/edit/1')))
    
    // Wait for button to be ready (enabled)
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await waitFor(() => expect(saveButton).not.toBeDisabled())
    
    const form = saveButton.closest('form') as HTMLFormElement
    expect(form).toBeInTheDocument()
    fireEvent.submit(form)

    await waitFor(() => expect(mutateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        image_payloads: expect.arrayContaining([
            expect.objectContaining({
                url: 'https://example.com/new-image.jpg'
            })
        ])
      }),
    ))
  })

  it('stops submission when upload fails', async () => {
    uploadImageSpy.mockRejectedValueOnce(new Error('upload failed'))
    renderForm()

    const file = new File(['img'], 'cover.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/click to upload/i), { target: { files: [file] } })

    // Wait for error message
    await waitFor(() => expect(screen.getByText(/upload failed/i)).toBeInTheDocument())
    
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

  it('sends variant payloads on submit', async () => {
    renderForm({
      variants: [{ id: 10, condition: 'Raw', grade: null, quantity: 1, price_adjustment: null }],
    })

    fireEvent.change(screen.getByLabelText('Variant 1 Quantity'), { target: { value: 3 } })
    fireEvent.change(screen.getByLabelText('Variant 1 Price Adjustment'), {
      target: { value: '125.00' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(mutateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          variant_payloads: [
            {
              condition: 'Raw',
              quantity: 3,
              price_adjustment: '125.00',
            },
          ],
        }),
      ),
    )
  })
})
