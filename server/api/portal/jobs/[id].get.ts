import { requirePortalUser } from '../../../utils/session'
import { appItems } from '../../../utils/directus'
import { C } from '#shared/utils/collections'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const id = getRouterParam(event, 'id') || ''
  const rows = await appItems(C.jobs, { filter: { id: { _eq: id }, employer: { _eq: employer.id } }, fields: '*', limit: 1 })
  if (!rows[0]) throw createError({ statusCode: 404, statusMessage: 'Stelle nicht gefunden' })
  return rows[0]
})
