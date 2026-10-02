import { requirePortalUser } from '../../../utils/session'
import { appItems } from '../../../utils/directus'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const q = getQuery(event)
  const filter: any = { employer: { _eq: employer.id } }
  if (typeof q.status === 'string' && q.status) filter.status = { _eq: q.status }
  if (typeof q.job === 'string' && q.job) filter.job = { _eq: q.job }
  return appItems('applications', { filter, fields: 'id,status,name,phone,email,qualification,hours_wish,earliest_start,message,note,source,date_created,first_contact_at,job.id,job.title,job.status,job.slug,job.contact_name', sort: '-date_created', limit: 500 })
})
