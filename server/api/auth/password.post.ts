import { C } from '#shared/utils/collections'
// Passwort-Login. Jeder Fehlschlag liefert dieselbe 401-Antwort (keine Unterscheidung zwischen Nutzer/Passwort).
import { verifyPassword } from '#shared/utils/password'
import { appFetch, appItems } from '../../utils/directus'
import { createRateLimiter } from '../../utils/rateLimit'

const limiter = createRateLimiter({ limit: 10, windowMs: 60 * 60 * 1000 })

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')
  if (!limiter.check(email)) throw createError({ statusCode: 429, statusMessage: 'Zu viele Versuche' })

  const users = await appItems<{ id: string; name: string; email: string; role: 'dienst' | 'rhowerk'; employer: string | null; status: string; password_hash: string | null }>(C.portalUsers, {
    filter: { email: { _eq: email } }, fields: 'id,name,email,role,employer,status,password_hash', limit: 1,
  })
  const user = users[0]
  // verifyPassword läuft auch ohne Nutzer (Hash null → false); Prüfung bleibt für alle Fälle gleich
  const ok = verifyPassword(password, user?.password_hash)
  if (!user || user.status !== 'active' || !user.password_hash || !ok) throw createError({ statusCode: 401, statusMessage: 'E-Mail oder Passwort falsch' })

  await appFetch(`/items/${C.portalUsers}/${user.id}`, { method: 'PATCH', body: { last_login: new Date().toISOString() } })
  await setUserSession(event, { user: { id: user.id, name: user.name, email: user.email, role: user.role, employerId: user.employer } })
  return { ok: true }
})
