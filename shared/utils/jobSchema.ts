// shared/utils/jobSchema.ts
import { z } from 'zod'
import { EMPLOYMENT_TYPE_LABELS } from './jobs.ts'

export function slugify(s: string): string {
  return s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum im Format JJJJ-MM-TT')
const optInt = z.preprocess((v) => (v === '' || v === null || v === undefined ? null : Number(v)), z.number().int().min(1).max(60).nullable())
const optNum = z.preprocess((v) => (v === '' || v === null || v === undefined ? null : Number(v)), z.number().min(0).max(100000).nullable())
const types = Object.keys(EMPLOYMENT_TYPE_LABELS) as [keyof typeof EMPLOYMENT_TYPE_LABELS, ...Array<keyof typeof EMPLOYMENT_TYPE_LABELS>]

export const jobSchema = z.object({
  title: z.string().trim().min(2, 'Bitte einen Titel angeben.').max(120),
  slug: z.string().regex(/^[a-z0-9-]{2,80}$/, 'Nur Kleinbuchstaben, Ziffern und Bindestriche.'),
  status: z.enum(['published', 'draft', 'filled', 'expired']),
  employment_types: z.array(z.enum(types)).min(1, 'Mindestens eine Beschäftigungsart wählen.'),
  hours_min: optInt.default(null), hours_max: optInt.default(null),
  start_note: z.string().trim().max(80).optional().default(''),
  salary_min: optNum.default(null), salary_max: optNum.default(null),
  salary_unit: z.enum(['MONTH', 'HOUR']).default('MONTH'),
  salary_note: z.string().trim().max(200).optional().default(''),
  location_override: z.union([z.null(), z.object({ street: z.string().trim().min(1), zip: z.string().trim().min(4), city: z.string().trim().min(1) })]).default(null),
  intro: z.string().trim().max(600).optional().default(''),
  tasks: z.string().max(5000).optional().default(''),
  requirements: z.string().max(5000).optional().default(''),
  contact_name: z.string().trim().max(120).optional().default(''),
  date_posted: date, valid_through: date,
  apply_email_override: z.preprocess((v) => (typeof v === 'string' ? v.trim() : ''), z.union([z.literal(''), z.string().email()])).default(''),
}).superRefine((d, ctx) => {
  if (d.hours_min != null && d.hours_max != null && d.hours_min > d.hours_max) ctx.addIssue({ code: 'custom', path: ['hours_max'], message: 'Höchstens muss größer als mindestens sein.' })
  if (d.salary_min != null && d.salary_max != null && d.salary_min > d.salary_max) ctx.addIssue({ code: 'custom', path: ['salary_max'], message: 'Gehalt bis muss größer als Gehalt von sein.' })
  if (d.valid_through < d.date_posted) ctx.addIssue({ code: 'custom', path: ['valid_through'], message: 'Gültig bis muss nach dem Veröffentlichungsdatum liegen.' })
})
export type JobInput = z.infer<typeof jobSchema>

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const unesc = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

/** Eine Zeile pro Punkt -> <ul><li>…</li></ul> (HTML wird escaped). */
export function linesToList(text: string): string {
  const items = (text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  return items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''
}
/** <ul><li>…</li></ul> -> eine Zeile pro Punkt. */
export function listToLines(html: string): string {
  const items = [...(html || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => unesc((m[1] ?? '').replace(/<[^>]+>/g, '').trim()))
  return items.join('\n')
}
