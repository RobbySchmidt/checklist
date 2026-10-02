import { aggregateReport, previousMonthRange } from '#shared/utils/report'
import { appItems } from '../utils/directus'
import { renderReportMail, sendMail } from '../utils/notify'

export async function runReport(now = new Date(), { force = false } = {}) {
  if (!force && now.getDate() !== 1) return { skipped: 'nicht der 1. des Monats' }
  const config = useRuntimeConfig()
  const range = previousMonthRange(now)
  const employers = await appItems<any>('employers', { filter: { status: { _eq: 'published' } }, fields: 'id,name,apply_email,report_email,domains' })
  let sent = 0
  for (const e of employers) {
    try {
      const [jobs, views, applications] = await Promise.all([
        appItems<any>('jobs', { filter: { employer: { _eq: e.id }, date_posted: { _lte: range.monthEnd } }, fields: 'status,valid_through' }),
        appItems<any>('job_views', { filter: { employer: { _eq: e.id }, day: { _between: [range.monthStart, range.monthEnd] } }, fields: 'day,source,count' }),
        appItems<any>('applications', { filter: { employer: { _eq: e.id } }, fields: 'date_created,first_contact_at,job.id,job.title' }),
      ])
      if (!jobs.length) continue
      const report = aggregateReport({ ...range, views, applications, jobs })
      const portalUrl = (config.portalBaseUrl as string) || (e.domains?.[0] ? `https://${e.domains[0]}` : (config.public.siteUrl as string))
      await sendMail(e.report_email || e.apply_email, config.notifyBcc as string, renderReportMail({ employerName: e.name, label: range.label, report, portalUrl: `${portalUrl}/portal` }))
      sent++
    } catch (err: unknown) {
      console.error('[report] Dienst übersprungen:', e.id, err instanceof Error ? err.message : err)
    }
  }
  return { employers: sent, month: range.label }
}
export default defineTask({ meta: { name: 'report', description: 'Monatsreport an alle Dienste' }, run: async () => ({ result: await runReport() }) })
