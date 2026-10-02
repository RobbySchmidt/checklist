// Stellen des Dienstes: Liste (nur sichtbare) und Einzelstelle per Slug. Der Server filtert bereits, isJobVisible ist die zweite Sicherung.
import type { Job } from '#shared/utils/jobs'
import { isJobVisible, toIsoDate } from '#shared/utils/jobs'

export const JOB_LIST_FIELDS = ['id', 'status', 'title', 'slug', 'employment_types', 'hours_min', 'hours_max', 'start_note', 'salary_min', 'salary_max', 'salary_unit', 'location_override', 'date_posted', 'valid_through']
export const JOB_DETAIL_FIELDS = ['*', 'employer.*', 'employer.logo.id', 'employer.logo.title']

function baseFilter(employerSlug: string) {
  return { status: { _eq: 'published' }, valid_through: { _gte: toIsoDate(new Date()) }, employer: { slug: { _eq: employerSlug } } }
}

export function useJobs() {
  const { public: pub } = useRuntimeConfig()
  const { getItems } = useDirectusItems()
  return useAsyncData('jobs', () => getItems<Job>({
    collection: 'jobs',
    params: { filter: baseFilter(pub.employerSlug as string), fields: JOB_LIST_FIELDS, sort: ['-date_posted'], limit: -1 },
  }) as unknown as Promise<Job[]>, { transform: (rows) => (rows ?? []).filter((j) => isJobVisible(j)) })
}

export function useJob(slug: string) {
  const { public: pub } = useRuntimeConfig()
  const { getItems } = useDirectusItems()
  return useAsyncData(`job:${slug}`, () => getItems<Job>({
    collection: 'jobs',
    params: { filter: { ...baseFilter(pub.employerSlug as string), slug: { _eq: slug } }, fields: JOB_DETAIL_FIELDS, limit: 1 },
  }) as unknown as Promise<Job[]>, { transform: (rows) => { const j = rows?.[0] ?? null; return j && isJobVisible(j) ? j : null } })
}
