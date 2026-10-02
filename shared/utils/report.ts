export interface ReportInput {
  monthStart: string; monthEnd: string
  views: Array<{ day: string; source: string; count: number }>
  applications: Array<{ date_created: string; first_contact_at: string | null; job: { id: string; title: string } | null }>
  jobs: Array<{ status: string; valid_through: string | null }>
}
const pad = (n: number) => String(n).padStart(2, '0')
export function previousMonthRange(now: Date) {
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const start = new Date(first.getFullYear(), first.getMonth() - 1, 1)
  const end = new Date(first.getFullYear(), first.getMonth(), 0)
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { monthStart: iso(start), monthEnd: iso(end), label: start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) }
}
export function aggregateReport(i: ReportInput) {
  const inRange = (d: string) => { const x = d.slice(0, 10); return x >= i.monthStart && x <= i.monthEnd }
  const viewsBySource: Record<string, number> = {}
  for (const v of i.views) if (inRange(v.day)) viewsBySource[v.source] = (viewsBySource[v.source] || 0) + (v.count || 0)
  const apps = i.applications.filter((a) => inRange(a.date_created))
  const byJob = new Map<string, { title: string; count: number }>()
  for (const a of apps) { const k = a.job?.id ?? '-'; const cur = byJob.get(k) ?? { title: a.job?.title ?? 'Unbekannt', count: 0 }; cur.count++; byJob.set(k, cur) }
  const hours = apps.filter((a) => a.first_contact_at).map((a) => (new Date(a.first_contact_at!).getTime() - new Date(a.date_created).getTime()) / 3600000).sort((x, y) => x - y)
  const median = hours.length ? (hours.length % 2 ? hours[(hours.length - 1) / 2]! : (hours[hours.length / 2 - 1]! + hours[hours.length / 2]!) / 2) : null
  return {
    viewsBySource,
    applicationsByJob: [...byJob.values()].sort((a, b) => b.count - a.count),
    medianHoursToContact: median === null ? null : Math.round(median * 10) / 10,
    jobsActive: i.jobs.filter((j) => j.status === 'published' && !!j.valid_through && j.valid_through.slice(0, 10) > i.monthEnd).length,
    jobsExpired: i.jobs.filter((j) => j.status === 'expired' || (!!j.valid_through && j.valid_through.slice(0, 10) >= i.monthStart && j.valid_through.slice(0, 10) <= i.monthEnd)).length,
    total: { views: Object.values(viewsBySource).reduce((s, n) => s + n, 0), applications: apps.length },
  }
}
