// Validierung des Anfrageformulars – im Browser (blocks/Contact.vue) und auf dem Server (server/api/inquiry.post.ts) identisch
import { z } from 'zod'

export const inquirySchema = z.object({
  name: z.string().trim().min(2, 'Bitte gib deinen Namen an.').max(120),
  email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse an.').max(200),
  phone: z.string().trim().max(60).optional().default(''),
  product: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(10, 'Bitte beschreibe kurz, was du dir wünschst (mind. 10 Zeichen).').max(4000),
  privacy: z.literal(true, { errorMap: () => ({ message: 'Bitte stimme der Verarbeitung deiner Angaben zu.' }) }),
})

export type InquiryInput = z.infer<typeof inquirySchema>
