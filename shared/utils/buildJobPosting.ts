// shared/utils/buildJobPosting.ts
// Erzeugt das JobPosting-JSON-LD für Google aus Dienst + Stelle. Eine Quelle für Stellenseite, Google-Vorschau und Prüfbericht.
import type { Employer, Job } from './jobs.ts'
import { jobLocation, jobPath } from './jobs.ts'

export interface JobPostingInput {
  job: Job
  employer: Employer
  siteUrl: string
  logoUrl?: string | null
}

const stripTags = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export function jobDescriptionHtml(job: Pick<Job, 'intro' | 'tasks' | 'requirements'>): string {
  const parts: string[] = []
  if (job.intro) parts.push(`<p>${job.intro}</p>`)
  if (job.tasks) parts.push(`<h2>Aufgaben</h2>${job.tasks}`)
  if (job.requirements) parts.push(`<h2>Voraussetzungen</h2>${job.requirements}`)
  return parts.join('\n')
}

export function buildJobPosting({ job, employer, siteUrl, logoUrl }: JobPostingInput): Record<string, any> {
  const base = (siteUrl || '').replace(/\/+$/, '')
  const url = `${base}${jobPath(job.slug)}`
  const loc = jobLocation(job, employer)

  const hiringOrganization: Record<string, any> = { '@type': 'Organization', name: employer.legal_name || employer.name }
  if (employer.website) hiringOrganization.sameAs = employer.website
  if (logoUrl) hiringOrganization.logo = logoUrl

  const entity: Record<string, any> = {
    '@type': 'JobPosting',
    '@id': `${url}#jobposting`,
    url,
    title: job.title,
    description: jobDescriptionHtml(job) || stripTags(job.title),
    datePosted: job.date_posted,
    validThrough: job.valid_through,
    hiringOrganization,
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', streetAddress: loc.street, postalCode: loc.zip, addressLocality: loc.city, addressCountry: 'DE' },
    },
    identifier: { '@type': 'PropertyValue', name: employer.name, value: job.id },
    directApply: true,
  }
  if (job.employment_types && job.employment_types.length) entity.employmentType = job.employment_types

  const min = toNumber(job.salary_min)
  if (min !== null) {
    const value: Record<string, any> = { '@type': 'QuantitativeValue', minValue: min, unitText: job.salary_unit === 'HOUR' ? 'HOUR' : 'MONTH' }
    const max = toNumber(job.salary_max)
    if (max !== null && max > min) value.maxValue = max
    entity.baseSalary = { '@type': 'MonetaryAmount', currency: 'EUR', value }
  }
  return entity
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
