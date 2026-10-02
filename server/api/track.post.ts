import { C } from '#shared/utils/collections'
// server/api/track.post.ts
// Zählt einen Aufruf der Stellenseite pro Stelle, Quelle und Tag. Keine Cookies, keine IPs.
import { isBot, trackSource } from '#shared/utils/track'
import { toIsoDate } from '#shared/utils/jobs'
import { appFetch, appItems } from '../utils/directus'

export default defineEventHandler(async (event) => {
  if (isBot(getHeader(event, 'user-agent'))) return { ok: true }
  const body = await readBody(event).catch(() => ({}))
  const job = String(body?.job || '')
  if (!/^[0-9a-f-]{36}$/.test(job)) return { ok: true }
  const employer = event.context.employer
  if (!employer) return { ok: true }
  const source = trackSource(body?.source)
  const day = toIsoDate(new Date())
  try {
    const rows = await appItems<{ id: string; count: number }>(C.jobViews, { filter: { job: { _eq: job }, employer: { _eq: employer.id }, source: { _eq: source }, day: { _eq: day } }, fields: 'id,count', limit: 1 })
    if (rows[0]) await appFetch(`/items/${C.jobViews}/${rows[0].id}`, { method: 'PATCH', body: { count: (rows[0].count || 0) + 1 } })
    else await appFetch(`/items/${C.jobViews}`, { method: 'POST', body: { job, employer: employer.id, source, day, count: 1 } })
  } catch (err: unknown) {
    console.warn('[track] nicht gezählt:', err instanceof Error ? err.message : err)
  }
  return { ok: true }
})
