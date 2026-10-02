// Stellen des Dienstes: Liste (nur sichtbare) und Einzelstelle per Slug. Der Server filtert bereits, isJobVisible ist die zweite Sicherung.
import type { Job } from '#shared/utils/jobs'
import { isJobVisible, toIsoDate } from '#shared/utils/jobs'

export const JOB_LIST_FIELDS = ['id', 'status', 'title', 'slug', 'employment_types', 'hours_min', 'hours_max', 'start_note', 'salary_min', 'salary_max', 'salary_unit', 'location_override', 'date_posted', 'valid_through']
export const JOB_DETAIL_FIELDS = ['*', 'employer.*', 'employer.logo.id', 'employer.logo.title']

function baseFilter(employerId: string) {
  return { status: { _eq: 'published' }, valid_through: { _gte: toIsoDate(new Date()) }, employer: { id: { _eq: employerId } } }
}

export async function useJobs() {
  const nuxtApp = useNuxtApp()
  const { getItems } = useDirectusItems()
  const { employer } = await useEmployer()
  const employerId = employer.value?.id
  return nuxtApp.runWithContext(() => useAsyncData('jobs', async () => {
    if (!employerId) return [] as Job[]
    return await getItems<Job>({
      collection: 'jobs',
      params: { filter: baseFilter(employerId), fields: JOB_LIST_FIELDS, sort: ['-date_posted'], limit: -1 },
    }) as unknown as Job[]
  }, { transform: (rows) => (rows ?? []).filter((j) => isJobVisible(j)) }))
}

export async function useJob(slug: string) {
  const nuxtApp = useNuxtApp()
  const { getItems } = useDirectusItems()
  const { employer } = await useEmployer()
  const employerId = employer.value?.id
  return nuxtApp.runWithContext(() => useAsyncData(`job:${slug}`, async () => {
    if (!employerId) return [] as Job[]
    return await getItems<Job>({
      collection: 'jobs',
      params: { filter: { ...baseFilter(employerId), slug: { _eq: slug } }, fields: JOB_DETAIL_FIELDS, limit: 1 },
    }) as unknown as Job[]
  }, { transform: (rows) => { const j = rows?.[0] ?? null; return j && isJobVisible(j) ? j : null } }))
}
