import { jobSchema } from '#shared/utils/jobSchema'
import { requirePortalUser } from '../../../utils/session'
import { appFetch, appItems } from '../../../utils/directus'
import { C } from '#shared/utils/collections'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const parsed = jobSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: 'Ungültige Eingaben', data: parsed.error.flatten().fieldErrors })
  const dup = await appItems(C.jobs, { filter: { employer: { _eq: employer.id }, slug: { _eq: parsed.data.slug } }, fields: 'id', limit: 1 })
  if (dup.length) throw createError({ statusCode: 409, statusMessage: 'Diesen URL-Namen gibt es schon.' })
  const res = await appFetch<{ data: { id: string } }>(`/items/${C.jobs}`, { method: 'POST', body: { ...parsed.data, employer: employer.id } })
  return { id: res.data.id }
})
