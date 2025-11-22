import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = isConfigured ? createClient(supabaseUrl!, supabaseKey!) : null

export async function uploadImageToSupabase(file: File, pathPrefix = 'product-images') {
  if (!supabase || !supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not configured')
  }
  const filename = `${pathPrefix}/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage.from('product-images').upload(filename, file, {
    upsert: true,
  })
  if (error) {
    throw error
  }
  const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(data.path)
  return publicUrl.publicUrl
}
