// Dienste für die Host-Auflösung, kurz gecacht. Portal-Routen, die einen Dienst ändern, rufen invalidateEmployerCache().
import type { Employer } from '#shared/utils/jobs'
import { appItems } from './directus'

const CACHE_MS = 60 * 1000
const FIELDS = '*,logo.id,logo.title'
let cache: { at: number; employers: Employer[] } | null = null

// Mit App-Token: domains und weitere interne Felder sind für Public nicht lesbar
export async function loadEmployers(): Promise<Employer[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.employers
  const employers = await appItems<Employer>('employers', { fields: FIELDS, filter: { status: { _eq: 'published' } } })
  cache = { at: Date.now(), employers }
  return cache.employers
}

export function invalidateEmployerCache() {
  cache = null
}
