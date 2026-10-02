// Directus-Zugriff des Servers mit dem Token der Rolle „App". Alle Portal- und Schreibzugriffe laufen hier durch.
const TIMEOUT_MS = 8000

export async function appFetch<T = any>(path: string, opts: { method?: string; query?: Record<string, any>; body?: any } = {}): Promise<T> {
  const config = useRuntimeConfig()
  const base = config.public.directusUrl as string
  const token = config.directusAppToken as string
  if (!base || !token) throw createError({ statusCode: 503, statusMessage: 'CMS nicht konfiguriert' })
  try {
    return await $fetch<T>(`${base}${path}`, {
      method: opts.method as any, query: opts.query, body: opts.body, timeout: TIMEOUT_MS,
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err: any) {
    const status = err?.statusCode ?? err?.response?.status
    if (status && status >= 400 && status < 500) {
      throw createError({ statusCode: status, statusMessage: err?.data?.errors?.[0]?.message || 'Directus-Fehler' })
    }
    console.error('[directus] nicht erreichbar:', err instanceof Error ? err.message : err)
    throw createError({ statusCode: 503, statusMessage: 'Gerade nicht erreichbar' })
  }
}

export async function appItems<T = any>(collection: string, query: Record<string, any> = {}): Promise<T[]> {
  const res = await appFetch<{ data: T[] }>(`/items/${collection}`, { query: { limit: -1, ...query } })
  return res.data ?? []
}

export async function appItem<T = any>(collection: string, id: string, query: Record<string, any> = {}): Promise<T | null> {
  try {
    const res = await appFetch<{ data: T }>(`/items/${collection}/${id}`, { query })
    return res.data ?? null
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.statusCode === 403) return null
    throw err
  }
}
