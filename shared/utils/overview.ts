export interface OverviewInput {
  monthStart: string; today: string
  views: Array<{ day: string; count: number }>
  applications: Array<{ status: string; date_created: string }>
  jobs: Array<{ status: string; valid_through: string | null }>
}
export function aggregateOverview(i: OverviewInput) {
  const inMonth = (d: string) => d.slice(0, 10) >= i.monthStart
  return {
    views: i.views.filter((v) => inMonth(v.day)).reduce((s, v) => s + (v.count || 0), 0),
    applications: i.applications.filter((a) => inMonth(a.date_created)).length,
    waiting: i.applications.filter((a) => a.status === 'neu').length,
    openJobs: i.jobs.filter((j) => j.status === 'published' && !!j.valid_through && j.valid_through.slice(0, 10) >= i.today).length,
  }
}
