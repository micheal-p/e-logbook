import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

// Uploads an entry image to the logbook-media bucket on behalf of the signed-in
// user. Runs server-side with the service role so the upload never depends on
// the browser correctly attaching the auth token. The file always lands in the
// caller's own folder (<userId>/...).
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const uid = (user as any)?.sub ?? (user as any)?.id // v2 returns JWT claims (sub = user id)
  if (!uid) throw createError({ statusCode: 401, statusMessage: 'Not signed in' })

  const form = await readMultipartFormData(event)
  const file = form?.find((f) => f.name === 'file')
  if (!file?.data?.length) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

  // Basic guard: images only, max ~5MB.
  if (!(file.type || '').startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'Only image files are allowed' })
  }
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'Image must be under 5MB' })
  }

  const ext = (file.filename?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${uid}/${Date.now()}.${ext}`

  const svc = serverSupabaseServiceRole(event)
  const { error } = await svc.storage
    .from('logbook-media')
    .upload(path, file.data, { contentType: file.type, upsert: true })
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  const { data } = svc.storage.from('logbook-media').getPublicUrl(path)
  return { url: data.publicUrl }
})
