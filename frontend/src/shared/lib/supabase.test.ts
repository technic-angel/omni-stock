import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { uploadMock, getPublicUrlMock, fromMock } = vi.hoisted(() => {
  const uploadMock = vi.fn()
  const getPublicUrlMock = vi.fn()
  const fromMock = vi.fn(() => ({
    upload: uploadMock,
    getPublicUrl: getPublicUrlMock,
  }))
  return { uploadMock, getPublicUrlMock, fromMock }
})

vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
vi.stubEnv('VITE_SUPABASE_BUCKET', 'product-images')

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: fromMock,
    },
  }),
}))

// Need crypto.randomUUID for deterministic filenames
const randomUUID = vi.fn(() => 'uuid-1234')
if (!globalThis.crypto) {
  // @ts-expect-error - intentionally shimming crypto for the test env
  globalThis.crypto = {}
}
// @ts-expect-error - assignment for test shim
globalThis.crypto.randomUUID = randomUUID

let supabaseModule: typeof import('./supabase')

const getSupabaseModule = () => {
  if (!supabaseModule) {
    throw new Error('Supabase module not loaded')
  }
  return supabaseModule
}

describe('supabase utilities', () => {
  beforeAll(async () => {
    supabaseModule = await import('./supabase')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates mime type and size before upload', () => {
    const { validateImageFile } = getSupabaseModule()
    expect(() =>
      validateImageFile(new File(['data'], 'photo.png', { type: 'image/png' })),
    ).not.toThrow()

    expect(() =>
      validateImageFile(new File(['data'], 'photo.txt', { type: 'text/plain' })),
    ).toThrow(/only jpeg/i)

    const largeFile = new File([new Uint8Array(2.5 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    expect(() => validateImageFile(largeFile)).toThrow(/2mb or smaller/i)
  })

  it('uploads an image and returns the public URL', async () => {
    const { SUPABASE_BUCKET, isSupabaseConfigured, uploadImageToSupabase } = getSupabaseModule()
    uploadMock.mockResolvedValueOnce({ data: { path: 'product-images/uuid-1234.png' }, error: null })
    getPublicUrlMock.mockReturnValueOnce({ data: { publicUrl: 'https://cdn.example/uuid-1234.png' } })

    const file = new File(['data'], 'cover.png', { type: 'image/png' })
    const publicUrl = await uploadImageToSupabase(file, 'covers')

    expect(isSupabaseConfigured()).toBe(true)
    expect(fromMock).toHaveBeenCalledWith(SUPABASE_BUCKET)
    expect(uploadMock).toHaveBeenCalledWith('covers/uuid-1234.png', file, expect.any(Object))
    expect(getPublicUrlMock).toHaveBeenCalledWith('product-images/uuid-1234.png')
    expect(publicUrl).toBe('https://cdn.example/uuid-1234.png')
  })
})
