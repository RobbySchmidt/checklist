// Dienst anhand des Hostnamens finden. Reine Funktion; die Middleware liefert die Dienste.
export function normalizeHost(raw: string | undefined): string {
  return (raw || '').trim().toLowerCase().replace(/:\d+$/, '')
}

export function resolveEmployerByHost<T extends { slug: string; domains?: string[] | null }>(host: string, employers: T[], fallbackSlug?: string): T | null {
  const h = normalizeHost(host)
  const byDomain = employers.find((e) => (e.domains ?? []).some((d) => normalizeHost(d) === h))
  if (byDomain) return byDomain
  if (fallbackSlug) return employers.find((e) => e.slug === fallbackSlug) ?? null
  return null
}
