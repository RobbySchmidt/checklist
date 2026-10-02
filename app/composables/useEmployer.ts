// Der Dienst dieser Instanz (EMPLOYER_SLUG). Einmal laden, überall nutzen; setzt Farb-Tokens als Inline-Style auf <html>.
import type { Employer } from '#shared/utils/jobs'

export const EMPLOYER_FIELDS = ['*', 'logo.id', 'logo.title']

export async function useEmployer() {
  const { public: pub } = useRuntimeConfig()
  const { getItems } = useDirectusItems()
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
    const rows = await getItems<Employer>({
      collection: 'employers',
      params: { filter: { status: { _eq: 'published' }, slug: { _eq: pub.employerSlug } }, fields: EMPLOYER_FIELDS, limit: 1 },
    }) as unknown as Employer[]
    employer.value = rows?.[0] ?? null
  }
  return { employer }
}
