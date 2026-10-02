import { requirePortalUser } from '../../utils/session'
import { appFetch } from '../../utils/directus'
import { invalidateEmployerCache } from '../../utils/employerCache'
import { C } from '#shared/utils/collections'

const MAX_BYTES = 2 * 1024 * 1024
const TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']

export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file' && p.filename)
  if (!file) throw createError({ statusCode: 422, statusMessage: 'Keine Datei erhalten' })
  if (!file.type || !TYPES.includes(file.type)) throw createError({ statusCode: 422, statusMessage: 'Bitte PNG, JPG, SVG oder WebP hochladen' })
  if (file.data.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'Die Datei ist größer als 2 MB' })

  const config = useRuntimeConfig()
  const form = new FormData()
  form.append('title', `Logo ${employer.name}`)
  form.append('file', new Blob([new Uint8Array(file.data)], { type: file.type }), file.filename)
  let id: string | undefined
  try {
    const res = await $fetch<{ data: { id: string } }>(`${config.public.directusUrl}/files`, {
      method: 'POST', body: form, timeout: 15000,
      headers: { Authorization: `Bearer ${config.directusAppToken}` },
    })
    id = res.data?.id
  } catch (err: any) {
    console.error('[upload] Directus:', err?.message)
    throw createError({ statusCode: 503, statusMessage: 'Upload gerade nicht möglich' })
  }
  if (!id) throw createError({ statusCode: 503, statusMessage: 'Upload gerade nicht möglich' })
  await appFetch(`/items/${C.employers}/${employer.id}`, { method: 'PATCH', body: { logo: id } })
  invalidateEmployerCache()
  return { id }
})
