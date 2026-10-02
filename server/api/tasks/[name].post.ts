// Manueller oder externer Cron-Auslöser. Header x-task-secret muss TASK_SECRET entsprechen.
import { runReminders } from '../../tasks/reminders'
import { runReport } from '../../tasks/report'
export default defineEventHandler(async (event) => {
  const { taskSecret } = useRuntimeConfig(event)
  if (!taskSecret || getHeader(event, 'x-task-secret') !== taskSecret) throw createError({ statusCode: 403 })
  const name = getRouterParam(event, 'name')
  const force = getQuery(event).force === '1'
  if (name === 'reminders') return runReminders()
  if (name === 'report') return runReport(new Date(), { force })
  throw createError({ statusCode: 404, statusMessage: 'Unbekannter Task' })
})
