import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = isConfigured ? createClient(supabaseUrl!, supabaseKey!) : null

const BUCKET = 'product-images'
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const isSupabaseConfigured = () => isConfigured

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

export async function uploadImageToSupabase(file: File, pathPrefix = BUCKET) {
  if (!supabase || !supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not configured')
  }

  validateImageFile(file)

  const filename = buildFilename(file.name, pathPrefix)
  const { data, error } = await supabase.storage.from(BUCKET).upload(filename, file, {
    upsert: false,
  })

  if (error) {
    throw error
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return publicUrl.publicUrl
}
