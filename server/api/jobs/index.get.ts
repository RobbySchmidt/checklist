import { C } from '#shared/utils/collections'
// Sichtbare Stellen des Dienstes dieser Domain (Server liest mit App-Token, kein CORS-Problem im Browser).
import type { Job } from '#shared/utils/jobs'
import { isJobVisible, toIsoDate } from '#shared/utils/jobs'

const JOB_LIST_FIELDS = ['id', 'status', 'title', 'slug', 'employment_types', 'hours_min', 'hours_max', 'start_note', 'salary_min', 'salary_max', 'salary_unit', 'location_override', 'date_posted', 'valid_through']

export default defineEventHandler(async (event) => {
  if (event.context.employerError) throw createError({ statusCode: 503, statusMessage: 'Dienst gerade nicht erreichbar' })
  const employer = event.context.employer
  if (!employer) return [] as Job[]
  const rows = await appItems<Job>(C.jobs, {
    filter: { status: { _eq: 'published' }, valid_through: { _gte: toIsoDate(new Date()) }, employer: { id: { _eq: employer.id } } },
    fields: JOB_LIST_FIELDS, sort: ['-date_posted'],
  })
  return rows.filter((j) => isJobVisible(j))
})
