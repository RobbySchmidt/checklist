import { selectReminderCandidates, groupByEmployer } from '#shared/utils/reminders'
import { employerSiteUrl } from '#shared/utils/host'
import { appFetch, appItems } from '../utils/directus'
import { renderReminderMail, sendMail } from '../utils/notify'

export async function runReminders(now = new Date()) {
  const config = useRuntimeConfig()
  const rows = await appItems<any>('applications', { filter: { status: { _eq: 'neu' }, reminder_sent_at: { _null: true } }, fields: 'id,status,name,phone,date_created,reminder_sent_at,job.title,employer.id,employer.name,employer.apply_email,employer.notify_reminders,employer.domains' })
  const groups = groupByEmployer(selectReminderCandidates(rows, now))
  let sent = 0
  for (const [, items] of groups) {
    const employer = items[0]!.employer as any
    try {
      const portalUrl = (config.portalBaseUrl as string) || employerSiteUrl(employer, config.public.siteUrl as string)
      const mail = renderReminderMail({ employerName: employer.name, portalUrl: `${portalUrl}/portal/bewerbungen`, items: items.map((a: any) => ({ name: a.name, phone: a.phone, jobTitle: a.job?.title ?? '', hours: Math.round((now.getTime() - new Date(a.date_created).getTime()) / 3600000) })) })
      await sendMail(employer.apply_email, config.notifyBcc as string, mail)
      for (const a of items) await appFetch(`/items/applications/${a.id}`, { method: 'PATCH', body: { reminder_sent_at: now.toISOString() } })
      sent++
    } catch (err: unknown) {
      console.error('[reminders] Dienst übersprungen:', employer.id, err instanceof Error ? err.message : err)
    }
  }
  return { employers: sent }
}
export default defineTask({ meta: { name: 'reminders', description: 'Erinnerung bei Bewerbungen ohne Rückruf' }, run: async () => ({ result: await runReminders() }) })
