// Löst den Dienst dieser Anfrage am Hostnamen auf und legt ihn in event.context.employer ab (Cache 5 Minuten).
import type { Employer } from '#shared/utils/jobs'
import { normalizeHost, resolveEmployerByHost } from '#shared/utils/host'

const CACHE_MS = 5 * 60 * 1000
const FIELDS = '*,logo.id,logo.title'
let cache: { at: number; employers: Employer[] } | null = null

async function loadEmployers(directusUrl: string): Promise<Employer[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.employers
  const res = await $fetch<{ data: Employer[] }>(`${directusUrl}/items/employers`, {
    query: { fields: FIELDS, filter: { status: { _eq: 'published' } }, limit: -1 }, timeout: 5000,
  })
  cache = { at: Date.now(), employers: res.data ?? [] }
  return cache.employers
}

export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt') || path.startsWith('/api/_nuxt_icon') || path.startsWith('/favicon')) return
  const { public: pub } = useRuntimeConfig(event)
  if (!pub.directusUrl) { event.context.employer = null; return }
  try {
    const employers = await loadEmployers(pub.directusUrl as string)
    event.context.employer = resolveEmployerByHost(normalizeHost(getRequestHost(event)), employers, pub.employerSlug as string | undefined)
  } catch (err: unknown) {
    console.error('[employer] Dienste konnten nicht geladen werden:', err instanceof Error ? err.message : err)
    event.context.employer = null
    event.context.employerError = true
  }
})
