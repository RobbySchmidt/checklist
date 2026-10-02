// Sitemap-Quelle für @nuxtjs/sitemap: alle veröffentlichten CMS-Seiten aus Directus (anonym gelesen, wie redirects.ts).
// Die Startseite (general.homepage) wird unter / ausgeliefert, nicht unter ihrem Slug. Seiten mit seo.no_index bleiben draußen.
import type { SitemapUrlInput } from '#sitemap/types'
import { toIsoDate } from '#shared/utils/jobs'

type PageRow = { id: number; slug: string | null; date_updated: string | null; seo: { no_index: boolean | null } | null }

const FETCH_TIMEOUT_MS = 5000

export default defineSitemapEventHandler(async (event) => {
  const directusUrl = useRuntimeConfig(event).public.directusUrl as string | undefined
  if (!directusUrl) return []
  const employer = event.context.employer

  try {
    const [pagesRes, generalRes, jobsRes] = await Promise.all([
      $fetch<{ data: PageRow[] }>(`${directusUrl}/items/pages`, {
        query: { fields: 'id,slug,date_updated,seo.no_index', filter: { status: { _eq: 'published' } }, limit: -1 },
        timeout: FETCH_TIMEOUT_MS,
      }),
      $fetch<{ data: { homepage: number | null } }>(`${directusUrl}/items/general`, {
        query: { fields: 'homepage' },
        timeout: FETCH_TIMEOUT_MS,
      }),
      employer ? $fetch<{ data: Array<{ slug: string; date_updated: string | null }> }>(`${directusUrl}/items/jobs`, {
        query: { fields: 'slug,date_updated', filter: { status: { _eq: 'published' }, valid_through: { _gte: toIsoDate(new Date()) }, employer: { id: { _eq: employer.id } } }, limit: -1 },
        timeout: FETCH_TIMEOUT_MS,
      }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] as Array<{ slug: string; date_updated: string | null }> }),
    ])
    const homepageId = generalRes?.data?.homepage ?? null
    const pages = (pagesRes?.data ?? [])
      .filter((p) => p.seo?.no_index !== true && (p.id === homepageId || p.slug))
      .map((p): SitemapUrlInput => ({
        loc: p.id === homepageId ? '/' : `/${p.slug}`,
        ...(p.date_updated ? { lastmod: p.date_updated } : {}),
      }))
    const jobs = (jobsRes?.data ?? []).map((j): SitemapUrlInput => ({ loc: `/jobs/${j.slug}`, ...(j.date_updated ? { lastmod: j.date_updated } : {}) }))
    return employer ? [...pages, { loc: '/jobs' }, ...jobs] : pages
  } catch (err: unknown) {
    console.warn('Sitemap: Seiten konnten nicht aus Directus geladen werden:', err instanceof Error ? err.message : err)
    return []
  }
})
