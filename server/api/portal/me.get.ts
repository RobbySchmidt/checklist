import { requirePortalUser } from '../../utils/session'
import { appItems } from '../../utils/directus'
import { C } from '#shared/utils/collections'
export default defineEventHandler(async (event) => {
  const { user, employer } = await requirePortalUser(event)
  const employers = user.role === 'rhowerk' ? await appItems<{ id: string; name: string }>(C.employers, { fields: 'id,name', sort: 'name' }) : undefined
  return { user, employer, employers }
})
