import { requirePortalUser } from '../../utils/session'
import { appItems } from '../../utils/directus'
export default defineEventHandler(async (event) => {
  const { user, employer } = await requirePortalUser(event)
  const employers = user.role === 'rhowerk' ? await appItems<{ id: string; name: string }>('employers', { fields: 'id,name', sort: 'name' }) : undefined
  return { user, employer, employers }
})
