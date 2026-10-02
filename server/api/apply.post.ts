// server/api/apply.post.ts
// Nimmt die Kurzbewerbung an: Honeypot, Rate-Limit, Validierung, Stelle erneut prüfen, Public-Create in applications, Benachrichtigung.
import { applicationSchema, normalizePhone } from '#shared/utils/applicationSchema'
import { isJobVisible, jobPath } from '#shared/utils/jobs'
import type { Job, Employer } from '#shared/utils/jobs'
import { createRateLimiter } from '../utils/rateLimit'
import { renderApplicationMail, notifyApplication } from '../utils/notify'

const FETCH_TIMEOUT_MS = 8000
// Client-IP für das Rate-Limit. Der erste X-Forwarded-For-Eintrag ist vom Client fälschbar;
// den letzten Eintrag hängt der vertrauenswürdige Proxy an. Ohne Header: Socket-Adresse.
function clientIp(event: Parameters<typeof getHeader>[0]): string {
  const xff = getHeader(event, 'x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]!
  }
  return event.node.req.socket.remoteAddress || 'unknown'
}

const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 })

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (body?.website) return { ok: true } // Honeypot

  const ip = clientIp(event)
  if (!limiter.check(ip)) throw createError({ statusCode: 429, statusMessage: 'Zu viele Bewerbungen. Bitte später erneut versuchen.' })

  const parsed = applicationSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Ungültige Eingaben', data: parsed.error.flatten().fieldErrors })
  }
  const input = parsed.data

  const config = useRuntimeConfig(event)
  const directusUrl = config.public.directusUrl as string | undefined
  if (!directusUrl) throw createError({ statusCode: 503, statusMessage: 'CMS nicht konfiguriert' })

  // Stelle erneut laden: zwischen Seitenaufruf und Absenden kann sie geschlossen worden sein
  let jobRes: { data: Array<Job & { employer: Employer }> }
  try {
    jobRes = await $fetch<{ data: Array<Job & { employer: Employer }> }>(`${directusUrl}/items/jobs`, {
    query: { filter: { id: { _eq: input.job } }, fields: 'id,status,title,slug,valid_through,apply_email_override,employer.id,employer.name,employer.apply_email,employer.is_demo', limit: 1 },
    timeout: FETCH_TIMEOUT_MS,
    })
  } catch (err: unknown) {
    console.error('Stelle konnte nicht geladen werden:', err instanceof Error ? err.message : err)
    throw createError({ statusCode: 503, statusMessage: 'Gerade nicht möglich' })
  }
  const job = jobRes.data?.[0]
  if (!job || !isJobVisible(job)) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar' })

  const phone = normalizePhone(input.phone)
  const source = job.employer.is_demo ? 'demo' : input.source
  const record = {
    job: job.id, employer: job.employer.id, name: input.name, phone,
    qualification: input.qualification, hours_wish: input.hours_wish, earliest_start: input.earliest_start, message: input.message,
    source, consent: true,
    user_agent: (getHeader(event, 'user-agent') || '').slice(0, 250), referrer: (getHeader(event, 'referer') || '').slice(0, 250),
  }
  try {
    await $fetch(`${directusUrl}/items/applications`, { method: 'POST', body: record, timeout: FETCH_TIMEOUT_MS })
  } catch (err: unknown) {
    console.error('Bewerbung konnte nicht gespeichert werden:', err instanceof Error ? err.message : err)
    throw createError({ statusCode: 502, statusMessage: 'Bewerbung konnte nicht gespeichert werden' })
  }

  // Benachrichtigung: Fehler hier dürfen die Antwort nicht kippen, die Bewerbung ist gespeichert
  let previewId: string | undefined
  try {
    const mail = renderApplicationMail({
      employerName: job.employer.name, jobTitle: job.title, jobUrl: `${config.public.siteUrl}${jobPath(job.slug)}`,
      name: input.name, phone, qualification: input.qualification, hoursWish: input.hours_wish,
      earliestStart: input.earliest_start, message: input.message, source, createdAt: new Date(),
    })
    const result = await notifyApplication(job.apply_email_override || job.employer.apply_email, config.notifyBcc as string, mail)
    previewId = result.previewId
  } catch (err: unknown) {
    console.error('Benachrichtigung fehlgeschlagen:', err instanceof Error ? err.message : err)
  }
  return { ok: true, ...(import.meta.dev && previewId ? { previewId } : {}) }
})
