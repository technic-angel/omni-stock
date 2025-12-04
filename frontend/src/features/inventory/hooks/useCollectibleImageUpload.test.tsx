import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCollectibleImageUpload } from './useCollectibleImageUpload'

const mockUpload = vi.fn()
const mockValidate = vi.fn()
const mockConfigured = vi.fn()

vi.mock('../../../shared/lib/supabase', () => ({
  uploadImageToSupabase: (...args: unknown[]) => mockUpload(...args),
  validateImageFile: (...args: unknown[]) => mockValidate(...args),
  isSupabaseConfigured: () => mockConfigured(),
}))

describe('useCollectibleImageUpload', () => {
  beforeEach(() => {
    mockUpload.mockReset()
    mockValidate.mockReset()
    mockConfigured.mockReset().mockReturnValue(true)
  })

  it('uploads a file when configured', async () => {
    const file = new File(['data'], 'image.png', { type: 'image/png' })
    mockUpload.mockResolvedValue('https://example.com/image.png')
    mockValidate.mockImplementation(() => {})

    const { result } = renderHook(() => useCollectibleImageUpload())

    await act(async () => {
      const url = await result.current.upload(file)
      expect(url).toBe('https://example.com/image.png')
    })

    expect(mockValidate).toHaveBeenCalledWith(file)
    expect(mockUpload).toHaveBeenCalledWith(file)
    await waitFor(() => expect(result.current.isUploading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('captures validation errors', async () => {
    const file = new File(['data'], 'image.txt', { type: 'text/plain' })
    mockValidate.mockImplementation(() => {
      throw new Error('Only images allowed.')
    })

    const { result } = renderHook(() => useCollectibleImageUpload())

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow('Only images allowed.')
    })
    await waitFor(() => expect(result.current.error).toBe('Only images allowed.'))
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('errors when supabase is not configured', async () => {
    mockConfigured.mockReturnValue(false)
    const file = new File(['data'], 'image.png', { type: 'image/png' })

    const { result } = renderHook(() => useCollectibleImageUpload())
    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow(/Supabase is not configured/)
    })
    await waitFor(() =>
      expect(result.current.error).toMatch(/Supabase is not configured/),
    )
    expect(mockValidate).not.toHaveBeenCalled()
    expect(mockUpload).not.toHaveBeenCalled()
  })
})
