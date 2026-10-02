// shared/utils/applicationSchema.ts
// Validierung der Kurzbewerbung – identisch im Browser (ApplyForm.vue) und auf dem Server (server/api/apply.post.ts).
import { z } from 'zod'
import { QUALIFICATION_LABELS, HOURS_WISH_LABELS } from './jobs.ts'

export const SOURCES = ['google', 'wa', 'qr', 'direct', 'demo'] as const
export type Source = typeof SOURCES[number]

export function normalizePhone(s: string): string {
  const trimmed = s.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/\D/g, '')
}

const phoneSchema = z.string().trim().min(1, 'Bitte gib deine Telefonnummer an.').max(40)
  .refine((s) => /^[+\d][\d\s\/().-]*$/.test(s) && s.replace(/\D/g, '').length >= 6, 'Bitte gib eine gültige Telefonnummer an.')

export const applicationSchema = z.object({
  job: z.string().uuid('Stelle unbekannt.'),
  name: z.string().trim().min(2, 'Bitte gib deinen Namen an.').max(120),
  phone: phoneSchema,
  qualification: z.enum(Object.keys(QUALIFICATION_LABELS) as [keyof typeof QUALIFICATION_LABELS, ...Array<keyof typeof QUALIFICATION_LABELS>], { errorMap: () => ({ message: 'Bitte wähle deine Qualifikation.' }) }),
  hours_wish: z.enum(Object.keys(HOURS_WISH_LABELS) as [keyof typeof HOURS_WISH_LABELS, ...Array<keyof typeof HOURS_WISH_LABELS>], { errorMap: () => ({ message: 'Bitte wähle deinen Stundenwunsch.' }) }),
  earliest_start: z.string().trim().max(80).optional().default(''),
  message: z.string().trim().max(2000, 'Bitte höchstens 2000 Zeichen.').optional().default(''),
  consent: z.literal(true, { errorMap: () => ({ message: 'Bitte stimme der Kontaktaufnahme zu.' }) }),
  source: z.preprocess((v) => (SOURCES.includes(v as Source) ? v : 'direct'), z.enum(SOURCES)).default('direct'),
})

export type ApplicationInput = z.infer<typeof applicationSchema>
