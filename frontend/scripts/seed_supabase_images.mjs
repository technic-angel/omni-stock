#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const BUCKET = 'product-images'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const images = [
  {
    name: 'sample1.svg',
    content:
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#0ea5e9"/><text x="50%" y="50%" font-size="32" fill="#fff" dominant-baseline="middle" text-anchor="middle">Sample 1</text></svg>',
  },
  {
    name: 'sample2.svg',
    content:
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#6366f1"/><text x="50%" y="50%" font-size="32" fill="#fff" dominant-baseline="middle" text-anchor="middle">Sample 2</text></svg>',
  },
  {
    name: 'sample3.svg',
    content:
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#10b981"/><text x="50%" y="50%" font-size="32" fill="#fff" dominant-baseline="middle" text-anchor="middle">Sample 3</text></svg>',
  },
]

async function download(image) {
  const buffer = Buffer.from(image.content, 'utf8')
  return { buffer, name: image.name }
}

async function upload(buffer, name) {
  const path = `seed-${Date.now()}-${name}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function main() {
  const urls = []
  for (const img of images) {
    const { buffer, name } = await download(img)
    const url = await upload(buffer, name)
    urls.push(url)
  }
  console.log('Seeded image URLs:')
  urls.forEach((u) => console.log(`  ${u}`))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
