// Stellen des Dienstes: Liste und Einzelstelle kommen von den Server-Routen (kein direkter Directus-Zugriff aus dem Browser, wegen CORS).
import type { Job } from '#shared/utils/jobs'

export async function useJobs() {
  const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host']) : undefined
  return useFetch<Job[]>('/api/jobs', { key: 'jobs', headers, default: () => [] as Job[] })
}

export async function useJob(slug: string) {
  const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host']) : undefined
  return useFetch<Job | null>(`/api/jobs/${encodeURIComponent(slug)}`, {
    key: `job:${slug}`, headers, default: () => null,
    onResponseError: () => {},
  })
}
