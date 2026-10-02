// Löst den Dienst dieser Anfrage am Hostnamen auf und legt ihn in event.context.employer ab (Cache in server/utils/employerCache.ts).
import type { Employer } from '#shared/utils/jobs'
import { normalizeHost, resolveEmployerByHost } from '#shared/utils/host'
import { loadEmployers } from '../utils/employerCache'


export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt') || path.startsWith('/api/_nuxt_icon') || path.startsWith('/favicon')) return
  const { public: pub } = useRuntimeConfig(event)
  if (!pub.directusUrl) { event.context.employer = null; return }
  try {
    const employers = await loadEmployers()
    event.context.employer = resolveEmployerByHost(normalizeHost(getRequestHost(event)), employers, pub.employerSlug as string | undefined)
  } catch (err: unknown) {
    console.error('[employer] Dienste konnten nicht geladen werden:', err instanceof Error ? err.message : err)
    event.context.employer = null
    event.context.employerError = true
  }
})
