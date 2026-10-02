import { hashToken, isTokenUsable } from '#shared/utils/auth'
import { appFetch, appItems } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const token = String(body?.token || '')
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw createError({ statusCode: 400, statusMessage: 'Link ungültig oder abgelaufen' })
  const rows = await appItems<{ id: string; expires_at: string; used_at: string | null; user: { id: string; name: string; email: string; role: 'dienst' | 'rhowerk'; employer: string | null; status: string } }>('login_tokens', {
    filter: { token_hash: { _eq: hashToken(token) } }, fields: 'id,expires_at,used_at,user.id,user.name,user.email,user.role,user.employer,user.status', limit: 1,
  })
  const row = rows[0]
  if (!row || !isTokenUsable(row) || row.user.status !== 'active') throw createError({ statusCode: 400, statusMessage: 'Link ungültig oder abgelaufen' })
  await appFetch(`/items/login_tokens/${row.id}`, { method: 'PATCH', body: { used_at: new Date().toISOString() } })
  await appFetch(`/items/portal_users/${row.user.id}`, { method: 'PATCH', body: { last_login: new Date().toISOString() } })
  await setUserSession(event, { user: { id: row.user.id, name: row.user.name, email: row.user.email, role: row.user.role, employerId: row.user.employer } })
  return { ok: true }
})
