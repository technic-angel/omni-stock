import { useCallback, useState } from 'react'

import {
  uploadImageToSupabase,
  validateImageFile,
  isSupabaseConfigured,
} from '../../../shared/lib/supabase'

type UploadResult = {
  upload: (file?: File | null) => Promise<string | undefined>
  isUploading: boolean
  error: string | null
  resetError: () => void
}

export const useCollectibleImageUpload = (): UploadResult => {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetError = useCallback(() => setError(null), [])

  const upload = useCallback(async (file?: File | null) => {
    if (!file) {
      return undefined
    }
    if (!isSupabaseConfigured()) {
      const message = 'Supabase is not configured. Please add VITE_SUPABASE_* env vars.'
      setError(message)
      throw new Error(message)
    }

    try {
      validateImageFile(file)
    } catch (validationError) {
      const message =
        validationError instanceof Error
          ? validationError.message
          : 'Image failed validation.'
      setError(message)
      throw new Error(message)
    }

    setIsUploading(true)
    setError(null)
    try {
      const url = await uploadImageToSupabase(file)
      return url
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Failed to upload image.'
      setError(message)
      throw uploadError instanceof Error ? uploadError : new Error(message)
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { upload, isUploading, error, resetError }
}

export default useCollectibleImageUpload
