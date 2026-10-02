// shared/utils/jobPostingCheck.ts
// Nachbildung des Rich-Results-Tests für JobPosting: Pflichtfelder (rot) und empfohlene Felder (gelb) nach Googles Dokumentation.
export interface CheckItem { key: string; label: string; ok: boolean }
export interface JobPostingCheck { ok: boolean; required: CheckItem[]; recommended: CheckItem[] }

const REQUIRED: Array<[string, string]> = [
  ['title', 'Titel'],
  ['description', 'Beschreibung'],
  ['datePosted', 'Veröffentlicht am'],
  ['validThrough', 'Gültig bis'],
  ['hiringOrganization.name', 'Arbeitgeber'],
  ['jobLocation.address.streetAddress', 'Straße'],
  ['jobLocation.address.postalCode', 'PLZ'],
  ['jobLocation.address.addressLocality', 'Ort'],
]
const RECOMMENDED: Array<[string, string]> = [
  ['baseSalary', 'Gehalt'],
  ['employmentType', 'Beschäftigungsart'],
  ['identifier', 'Kennung'],
  ['hiringOrganization.logo', 'Logo'],
  ['directApply', 'Direktbewerbung'],
]

function get(obj: any, path: string): unknown {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}
function present(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0
  return true
}

export function checkJobPosting(entity: Record<string, any>): JobPostingCheck {
  const required = REQUIRED.map(([key, label]) => ({ key, label, ok: present(get(entity, key)) }))
  const recommended = RECOMMENDED.map(([key, label]) => ({ key, label, ok: present(get(entity, key)) }))
  return { ok: required.every((i) => i.ok), required, recommended }
}
