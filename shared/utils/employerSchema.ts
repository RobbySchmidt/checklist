import { z } from 'zod'
const optStr = (max: number) => z.string().trim().max(max).optional().default('')
const emptyOr = <T extends z.ZodTypeAny>(inner: T) => z.preprocess((v) => (typeof v === 'string' ? v.trim() : v ?? ''), z.union([z.literal(''), inner])).default('')
export const employerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  legal_name: optStr(160),
  color_primary: emptyOr(z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Farbe als #rrggbb')),
  color_secondary: emptyOr(z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Farbe als #rrggbb')),
  address_street: z.string().trim().min(2).max(120),
  address_zip: z.string().trim().regex(/^\d{4,5}$/, 'PLZ mit 4 bis 5 Ziffern'),
  address_city: z.string().trim().min(2).max(80),
  phone: optStr(40),
  website: emptyOr(z.string().url('Bitte mit https:// angeben')),
  imprint_url: emptyOr(z.string().url('Bitte mit https:// angeben')),
  privacy_url: emptyOr(z.string().url('Bitte mit https:// angeben')),
  apply_email: z.string().trim().email(),
  apply_whatsapp: emptyOr(z.string().regex(/^\d{8,16}$/, 'Nur Ziffern, international ohne Plus')),
  service_area: optStr(200),
  about: optStr(1000),
  schedule_model: optStr(500),
  benefits: z.array(z.object({ label: z.string().trim().min(1).max(80), detail: z.string().trim().max(160).optional().default('') })).max(12).default([]),
  notify_reminders: z.boolean().default(true),
  report_email: emptyOr(z.string().email()),
  template_invite: optStr(2000),
  template_reject: optStr(2000),
  logo: z.string().uuid().nullable().optional(),
})
export type EmployerInput = z.infer<typeof employerSchema>
