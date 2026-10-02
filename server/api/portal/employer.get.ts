import { requirePortalUser } from '../../utils/session'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  return employer
})
