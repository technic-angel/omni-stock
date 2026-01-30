/* istanbul ignore file -- supabase client wiring exercised via higher-level hooks */
import { createClient } from '@supabase/supabase-js'
import { http } from './http'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET ?? 'product-images'

const isConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = isConfigured ? createClient(supabaseUrl!, supabaseKey!) : null

export const SUPABASE_BUCKET = supabaseBucket
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const isSupabaseConfigured = () => isConfigured || import.meta.env.DEV

export function validateImageFile(file: File) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WEBP, or GIF images are supported.')
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Images must be 2MB or smaller.')
  }
}

function buildFilename(fileName: string, pathPrefix: string) {
  const extension = fileName.split('.').pop() ?? 'bin'
  const uuid = globalThis.crypto?.randomUUID?.() ?? Date.now().toString()
  return `${pathPrefix}/${uuid}.${extension}`
}

export async function uploadImageToSupabase(file: File, pathPrefix = supabaseBucket) {
  validateImageFile(file)

  if (supabase) {
    const filename = buildFilename(file.name, pathPrefix)
    const { data, error } = await supabase.storage.from(supabaseBucket).upload(filename, file, {
      upsert: false,
    })

    if (error) {
      throw error
    }

    const { data: publicUrl } = supabase.storage.from(supabaseBucket).getPublicUrl(data.path)
    return publicUrl.publicUrl
  }

  // Fallback to local backend upload if Supabase is not configured
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await http.post<{ url: string }>('/core/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}
