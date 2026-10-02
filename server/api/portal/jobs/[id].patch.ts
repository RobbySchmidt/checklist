import { jobSchema } from '#shared/utils/jobSchema'
import { requirePortalUser } from '../../../utils/session'
import { appFetch, appItems } from '../../../utils/directus'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const id = getRouterParam(event, 'id') || ''
  const existing = await appItems('jobs', { filter: { id: { _eq: id }, employer: { _eq: employer.id } }, fields: '*', limit: 1 })
  if (!existing[0]) throw createError({ statusCode: 404, statusMessage: 'Stelle nicht gefunden' })
  const body = await readBody(event)
  // Teil-Update (z. B. nur status) wird mit dem Bestand gemischt und dann komplett validiert
  const parsed = jobSchema.safeParse({ ...existing[0], ...body })
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: 'Ungültige Eingaben', data: parsed.error.flatten().fieldErrors })
  if (parsed.data.slug !== existing[0].slug) {
    const dup = await appItems('jobs', { filter: { employer: { _eq: employer.id }, slug: { _eq: parsed.data.slug }, id: { _neq: id } }, fields: 'id', limit: 1 })
    if (dup.length) throw createError({ statusCode: 409, statusMessage: 'Diesen URL-Namen gibt es schon.' })
  }
  await appFetch(`/items/jobs/${id}`, { method: 'PATCH', body: parsed.data })
  return { ok: true }
})
