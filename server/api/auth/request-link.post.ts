// Magic-Link anfordern. Antwortet immer ok, damit E-Mail-Adressen nicht erraten werden können.
import { employerSiteUrl } from '#shared/utils/host'
import { createLoginToken, tokenExpiry, TOKEN_MINUTES } from '#shared/utils/auth'
import { appFetch, appItems } from '../../utils/directus'
import { createRateLimiter } from '../../utils/rateLimit'
import { renderLoginMail, sendMail } from '../../utils/notify'

const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 })

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: true }
  if (!limiter.check(email)) return { ok: true }

  const users = await appItems<{ id: string; name: string; status: string; role: string; employer: { domains?: string[] | null } | null }>('portal_users', { filter: { email: { _eq: email }, status: { _eq: 'active' } }, fields: 'id,name,status,role,employer.domains', limit: 1 })
  const user = users[0]
  if (!user) return { ok: true }

  const { token, hash } = createLoginToken()
  await appFetch('/items/login_tokens', { method: 'POST', body: { user: user.id, token_hash: hash, expires_at: tokenExpiry() } })

  const config = useRuntimeConfig(event)
  // Nie aus dem Host-Header bauen (Link-Poisoning)
  const siteUrl = config.public.siteUrl as string
  const base = ((config.portalBaseUrl as string) || (user.role === 'dienst' ? employerSiteUrl(user.employer, siteUrl) : siteUrl)).replace(/\/+$/, '')
  const link = `${base}/portal/login?token=${token}`
  const mail = renderLoginMail({ name: user.name, link, minutes: TOKEN_MINUTES })
  let previewId: string | undefined
  try {
    previewId = (await sendMail(email, '', mail)).previewId
  } catch (err: unknown) {
    console.error('Login-Mail fehlgeschlagen:', err instanceof Error ? err.message : err)
    throw createError({ statusCode: 503, statusMessage: 'Mail konnte nicht gesendet werden, bitte später erneut versuchen' })
  }
  return { ok: true, ...(import.meta.dev && previewId ? { previewId } : {}) }
})
