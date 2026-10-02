import { z } from 'zod'
import { requirePortalUser } from '../../../utils/session'
import { appFetch, appItems } from '../../../utils/directus'
const schema = z.object({ status: z.enum(['neu', 'kontaktiert', 'gespraech', 'zusage', 'absage']).optional(), note: z.string().max(2000).optional() }).refine((d) => d.status !== undefined || d.note !== undefined, 'Nichts zu ändern')
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const id = getRouterParam(event, 'id') || ''
  if (!z.string().uuid().safeParse(id).success) throw createError({ statusCode: 404, statusMessage: 'Bewerbung nicht gefunden' })
  const rows = await appItems('applications', { filter: { id: { _eq: id }, employer: { _eq: employer.id } }, fields: 'id,status,first_contact_at', limit: 1 })
  if (!rows[0]) throw createError({ statusCode: 404, statusMessage: 'Bewerbung nicht gefunden' })
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: 'Ungültige Eingaben' })
  const body: any = { ...parsed.data }
  if (parsed.data.status && rows[0].status === 'neu' && parsed.data.status !== 'neu' && !rows[0].first_contact_at) body.first_contact_at = new Date().toISOString()
  await appFetch(`/items/applications/${id}`, { method: 'PATCH', body })
  return { ok: true }
})
