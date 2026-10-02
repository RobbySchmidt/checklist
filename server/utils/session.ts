import type { Employer } from '#shared/utils/jobs'
import { normalizeHost } from '#shared/utils/host'
import { appItems } from './directus'
import { C } from '#shared/utils/collections'

export interface SessionUser { id: string; name: string; email: string; role: 'dienst' | 'rhowerk'; employerId: string | null }

export async function requirePortalUser(event: any): Promise<{ user: SessionUser; employer: Employer }> {
  const session = await getUserSession(event)
  const sessionUser = session?.user as SessionUser | undefined
  if (!sessionUser) throw createError({ statusCode: 401, statusMessage: 'Bitte anmelden' })

  // Nutzer bei jedem Request gegen die Datenbank prüfen: Sperrung und Rollenwechsel wirken sofort
  const dbUsers = await appItems<{ id: string; status: string; role: 'dienst' | 'rhowerk'; employer: string | null }>(C.portalUsers, { filter: { id: { _eq: sessionUser.id } }, fields: 'id,status,role,employer', limit: 1 })
  const db = dbUsers[0]
  if (!db || db.status !== 'active') {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Bitte anmelden' })
  }
  const user: SessionUser = { ...sessionUser, role: db.role, employerId: db.employer ?? null }

  const hostEmployer = event.context.employer as Employer | null
  let employerId: string | null
  if (user.role === 'rhowerk') {
    employerId = (getQuery(event).employer as string) || hostEmployer?.id || null
  } else {
    employerId = user.employerId
    const host = normalizeHost(getRequestHost(event))
    const isLocal = host === 'localhost' || host === '127.0.0.1'
    if (!isLocal && hostEmployer && hostEmployer.id !== employerId) {
      throw createError({ statusCode: 403, statusMessage: 'Dieses Portal gehört zu einem anderen Dienst' })
    }
  }
  if (!employerId) throw createError({ statusCode: 403, statusMessage: 'Kein Dienst zugeordnet' })
  const rows = await appItems<Employer>(C.employers, { filter: { id: { _eq: employerId } }, fields: '*,logo.id,logo.title', limit: 1 })
  if (!rows[0]) throw createError({ statusCode: 404, statusMessage: 'Dienst nicht gefunden' })
  return { user, employer: rows[0] }
}
