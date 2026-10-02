import { employerSchema } from '#shared/utils/employerSchema'
import { requirePortalUser } from '../../utils/session'
import { appFetch } from '../../utils/directus'
import { invalidateEmployerCache } from '../../utils/employerCache'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const body = await readBody(event)
  // Teil-Update wird mit dem Bestand gemischt und komplett validiert; Logo-Relation auf die ID reduzieren.
  // Null-Felder aus Directus werden weggelassen, damit die Defaults des Schemas greifen.
  const current: any = Object.fromEntries(Object.entries(employer).filter(([, v]) => v !== null))
  current.logo = typeof employer.logo === 'object' && employer.logo ? employer.logo.id : (employer.logo ?? null)
  const parsed = employerSchema.safeParse({ ...current, ...body })
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: 'Ungültige Eingaben', data: parsed.error.flatten().fieldErrors })
  // domains, slug, status, is_demo sind nicht im Schema und werden nie übernommen.
  const data: any = { ...parsed.data }
  if (data.logo === undefined) delete data.logo
  await appFetch(`/items/employers/${employer.id}`, { method: 'PATCH', body: data })
  invalidateEmployerCache()
  return { ok: true }
})
