// Nimmt das Anfrageformular (blocks/Contact.vue) entgegen und legt anonym ein Item in „inquiries“ an.
// Kein Admin-Token nötig: die Public-Policy darf dort nur anlegen (ensurePublicCreate in scripts/setup-schema.mjs).
import { inquirySchema } from '#shared/utils/inquirySchema'

const FETCH_TIMEOUT_MS = 8000

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Honeypot: Bots füllen das versteckte Feld aus – still „ok“ antworten, nichts speichern
  if (body?.website) return { ok: true }

  const parsed = inquirySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Ungültige Eingaben', data: parsed.error.flatten().fieldErrors })
  }

  const directusUrl = useRuntimeConfig(event).public.directusUrl as string | undefined
  if (!directusUrl) throw createError({ statusCode: 503, statusMessage: 'CMS nicht konfiguriert' })

  try {
    await $fetch(`${directusUrl}/items/inquiries`, { method: 'POST', body: parsed.data, timeout: FETCH_TIMEOUT_MS })
  } catch (err: unknown) {
    console.error('Anfrage konnte nicht gespeichert werden:', err instanceof Error ? err.message : err)
    throw createError({ statusCode: 502, statusMessage: 'Anfrage konnte nicht gespeichert werden' })
  }
  return { ok: true }
})
