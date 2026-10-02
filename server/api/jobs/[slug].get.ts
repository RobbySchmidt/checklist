// Eine sichtbare Stelle des Dienstes dieser Domain per Slug; der Dienst wird auf öffentliche Felder reduziert.
import type { Job } from '#shared/utils/jobs'
import { isJobVisible, toIsoDate } from '#shared/utils/jobs'

const JOB_DETAIL_FIELDS = ['*', 'employer.*', 'employer.logo.id', 'employer.logo.title']
const NOT_FOUND = { statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar' }

export default defineEventHandler(async (event) => {
  if (event.context.employerError) throw createError({ statusCode: 503, statusMessage: 'Dienst gerade nicht erreichbar' })
  const employer = event.context.employer
  const slug = getRouterParam(event, 'slug')
  if (!employer || !slug) throw createError(NOT_FOUND)
  const rows = await appItems<Job>('jobs', {
    filter: { status: { _eq: 'published' }, valid_through: { _gte: toIsoDate(new Date()) }, employer: { id: { _eq: employer.id } }, slug: { _eq: slug } },
    fields: JOB_DETAIL_FIELDS, limit: 1,
  })
  const job = rows[0]
  if (!job || !isJobVisible(job)) throw createError(NOT_FOUND)
  return { ...job, employer: publicEmployer((job as any).employer) }
})
