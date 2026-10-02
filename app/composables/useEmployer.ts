// Der Dienst dieser Domain (Server-Middleware löst den Host auf). Einmal laden, überall nutzen; setzt Farb-Tokens auf <html>.
import type { Employer } from '#shared/utils/jobs'
import { readableText, isHex } from '#shared/utils/color'

export async function useEmployer() {
  const employer = useState<Employer | null>('employer', () => null)
  // useHead vor dem await: danach ist der Nuxt-Kontext weg; der Getter bleibt reaktiv
  useHead(() => ({
    htmlAttrs: {
      style: employerStyle(employer.value),
    },
  }))
  if (!employer.value) {
    const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host']) : undefined
    try {
      employer.value = await $fetch<Employer>('/api/employer', { headers })
    } catch (err: any) {
      if (err?.statusCode === 404) {
        await navigateTo('/kein-dienst')
        return { employer }
      }
      throw createError({ statusCode: 503, statusMessage: 'Dienst gerade nicht erreichbar', fatal: true })
    }
  }
  return { employer }
}

// Farb-Tokens des Dienstes inklusive passender Schriftfarben, damit Knöpfe und Chips auch bei dunkler Zweitfarbe lesbar bleiben.
function employerStyle(e: Employer | null): string | undefined {
  if (!e?.color_primary || !isHex(e.color_primary)) return undefined
  const parts = [`--primary:${e.color_primary}`, `--primary-foreground:${readableText(e.color_primary)}`]
  if (e.color_secondary && isHex(e.color_secondary)) {
    parts.push(`--secondary:${e.color_secondary}`, `--secondary-foreground:${readableText(e.color_secondary)}`)
  }
  return parts.join(';')
}
