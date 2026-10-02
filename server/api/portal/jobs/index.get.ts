import { requirePortalUser } from '../../../utils/session'
import { appItems } from '../../../utils/directus'
import { toIsoDate } from '#shared/utils/jobs'
import { C } from '#shared/utils/collections'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const since = toIsoDate(new Date(Date.now() - 30 * 86400000))
  const [jobs, apps, views] = await Promise.all([
    appItems(C.jobs, { filter: { employer: { _eq: employer.id } }, fields: 'id,title,slug,status,valid_through,date_posted', sort: '-date_posted' }),
    appItems(C.applications, { filter: { employer: { _eq: employer.id } }, fields: 'job' }),
    appItems(C.jobViews, { filter: { employer: { _eq: employer.id }, day: { _gte: since } }, fields: 'job,count' }),
  ])
  const appCount: Record<string, number> = {}; for (const a of apps) appCount[a.job] = (appCount[a.job] || 0) + 1
  const viewCount: Record<string, number> = {}; for (const v of views) viewCount[v.job] = (viewCount[v.job] || 0) + (v.count || 0)
  return jobs.map((j: any) => ({ ...j, applications: appCount[j.id] || 0, views30: viewCount[j.id] || 0 }))
})
