import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

// Uploads an entry/passport image to the logbook-media bucket for the signed-in
// user. Runs server-side (reads the session from the request cookie, which is
// reliable) and uploads AS THE USER so storage.objects.owner is set correctly
// and the per-folder RLS is satisfied. File always lands in <userId>/...
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const uid = (user as any)?.sub ?? (user as any)?.id // v2 returns JWT claims (sub = user id)
  if (!uid) throw createError({ statusCode: 401, statusMessage: 'Not signed in' })

  const form = await readMultipartFormData(event)
  const file = form?.find((f) => f.name === 'file')
  if (!file?.data?.length) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  if (!(file.type || '').startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'Only image files are allowed' })
  }
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'Image must be under 5MB' })
  }

  const ext = (file.filename?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${uid}/${Date.now()}.${ext}`

  const supa = await serverSupabaseClient(event)
  const { error } = await supa.storage
    .from('logbook-media')
    .upload(path, file.data, { contentType: file.type, upsert: true })
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  const { data } = supa.storage.from('logbook-media').getPublicUrl(path)
  return { url: data.publicUrl }
})
