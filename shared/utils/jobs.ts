// shared/utils/jobs.ts
// Reine Domänen-Helfer für Stellen. Keine Nuxt-Imports – wird in Browser, Server und Tests genutzt.

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'INTERN' | 'CONTRACTOR' | 'OTHER'
export type SalaryUnit = 'MONTH' | 'HOUR'
export type JobStatus = 'published' | 'draft' | 'filled' | 'expired'
export type Benefit = { label: string; detail?: string | null }

export interface Employer {
  id: string
  status: string
  name: string
  slug: string
  legal_name?: string | null
  logo?: { id: string; title?: string | null } | string | null
  color_primary?: string | null
  color_secondary?: string | null
  address_street: string
  address_zip: string
  address_city: string
  phone?: string | null
  website?: string | null
  imprint_url?: string | null
  privacy_url?: string | null
  apply_email: string
  apply_whatsapp?: string | null
  service_area?: string | null
  about?: string | null
  schedule_model?: string | null
  benefits?: Benefit[] | null
  is_demo?: boolean | null
  domains?: string[] | null
}

export interface Job {
  id: string
  status: JobStatus
  employer: Employer | string
  title: string
  slug: string
  employment_types?: EmploymentType[] | null
  hours_min?: number | null
  hours_max?: number | null
  start_note?: string | null
  salary_min?: number | string | null
  salary_max?: number | string | null
  salary_unit?: SalaryUnit | null
  salary_note?: string | null
  location_override?: { street?: string; zip?: string; city?: string } | null
  intro?: string | null
  tasks?: string | null
  requirements?: string | null
  benefits_override?: Benefit[] | null
  contact_name?: string | null
  date_posted: string
  valid_through: string | null
  apply_email_override?: string | null
  google_indexed_at?: string | null
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Vollzeit', PART_TIME: 'Teilzeit', TEMPORARY: 'Befristet', INTERN: 'Ausbildung / Praktikum', CONTRACTOR: 'Freie Mitarbeit', OTHER: 'Sonstiges',
}
export const QUALIFICATION_LABELS = {
  pflegefachkraft: 'Pflegefachkraft', pflegehilfskraft: 'Pflegehilfskraft', betreuungskraft_43b: 'Betreuungskraft § 43b',
  auszubildende: 'Auszubildende/r', hauswirtschaft: 'Hauswirtschaft', sonstiges: 'Sonstiges',
} as const
export const HOURS_WISH_LABELS = {
  vollzeit: 'Vollzeit', teilzeit_30: 'Teilzeit, ca. 30 Stunden', teilzeit_20: 'Teilzeit, ca. 20 Stunden', minijob: 'Minijob', offen: 'Noch offen',
} as const
export type Qualification = keyof typeof QUALIFICATION_LABELS
export type HoursWish = keyof typeof HOURS_WISH_LABELS

const pad = (n: number) => String(n).padStart(2, '0')
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isJobVisible(job: Pick<Job, 'status' | 'valid_through'>, now: Date = new Date()): boolean {
  if (job.status !== 'published') return false
  if (!job.valid_through) return false
  return job.valid_through.slice(0, 10) >= toIsoDate(now)
}

export function jobLocation(job: Pick<Job, 'location_override'>, employer: Pick<Employer, 'address_street' | 'address_zip' | 'address_city'>) {
  const o = job.location_override
  if (o && o.street && o.zip && o.city) return { street: o.street, zip: o.zip, city: o.city }
  return { street: employer.address_street, zip: employer.address_zip, city: employer.address_city }
}

const fmt = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const num = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
export function salaryText(job: Pick<Job, 'salary_min' | 'salary_max' | 'salary_unit'>): string | null {
  const min = num(job.salary_min)
  if (min === null) return null
  const max = num(job.salary_max)
  const unit = job.salary_unit === 'HOUR' ? 'pro Stunde' : 'pro Monat'
  const f = (n: number) => (Number.isInteger(n) ? fmt.format(n) : n.toFixed(2).replace('.', ','))
  return max !== null && max > min ? `${f(min)} – ${f(max)} € ${unit}` : `ab ${f(min)} € ${unit}`
}

export function jobBenefits(job: Pick<Job, 'benefits_override'>, employer: Pick<Employer, 'benefits'>): Benefit[] {
  if (job.benefits_override && job.benefits_override.length) return job.benefits_override
  return employer.benefits ?? []
}

export function jobPath(slug: string): string {
  return `/jobs/${slug}`
}

export function isOverdue(iso: string, now: number = Date.now()): boolean {
  return now - new Date(iso).getTime() >= 24 * 3600000
}

export function waitingLabel(iso: string, now: number = Date.now()): string {
  const min = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000))
  if (min < 60) return `seit ${min} Min.`
  const h = Math.floor(min / 60)
  if (h < 48) return `seit ${h} Std.`
  const d = Math.floor(h / 24)
  return d === 1 ? 'seit 1 Tag' : `seit ${d} Tagen`
}

/** Trennt „(m/w/d)“ vom Stellentitel, damit es als Nebeninfo kleiner erscheinen kann. */
export function splitJobTitle(title: string): { main: string; suffix: string } {
  const m = /\s*\((m\/w\/d|w\/m\/d|d\/m\/w)\)/.exec(title)
  if (!m) return { main: title, suffix: '' }
  return { main: (title.slice(0, m.index) + title.slice(m.index + m[0].length)).trim(), suffix: `(${m[1]})` }
}
