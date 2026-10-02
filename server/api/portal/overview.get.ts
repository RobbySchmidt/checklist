import { toIsoDate } from '#shared/utils/jobs'
import { aggregateOverview } from '#shared/utils/overview'
import { requirePortalUser } from '../../utils/session'
import { appItems } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const now = new Date()
  const today = toIsoDate(now)
  const monthStart = `${today.slice(0, 7)}-01`
  const [views, applications, jobs, waiting] = await Promise.all([
    appItems('job_views', { filter: { employer: { _eq: employer.id }, day: { _gte: monthStart } }, fields: 'day,count' }),
    appItems('applications', { filter: { employer: { _eq: employer.id } }, fields: 'status,date_created' }),
    appItems('jobs', { filter: { employer: { _eq: employer.id } }, fields: 'status,valid_through' }),
    appItems('applications', { filter: { employer: { _eq: employer.id }, status: { _eq: 'neu' } }, fields: 'id,name,phone,qualification,hours_wish,date_created,job.title,job.slug', sort: 'date_created', limit: 50 }),
  ])
  return { month: today.slice(0, 7), stats: aggregateOverview({ monthStart, today, views, applications, jobs }), waiting }
})
