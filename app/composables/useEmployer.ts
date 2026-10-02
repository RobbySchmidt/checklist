// Der Dienst dieser Domain (Server-Middleware löst den Host auf). Einmal laden, überall nutzen; setzt Farb-Tokens auf <html>.
import type { Employer } from '#shared/utils/jobs'

export async function useEmployer() {
  const employer = useState<Employer | null>('employer', () => null)
  // useHead vor dem await: danach ist der Nuxt-Kontext weg; der Getter bleibt reaktiv
  useHead(() => ({
    htmlAttrs: {
      style: employer.value?.color_primary
        ? `--primary:${employer.value.color_primary};--secondary:${employer.value.color_secondary || ''}`
        : undefined,
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
