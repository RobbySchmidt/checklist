// Sitemap-Quelle für @nuxtjs/sitemap: alle veröffentlichten CMS-Seiten aus Directus (anonym gelesen, wie redirects.ts).
// Die Startseite (general.homepage) wird unter / ausgeliefert, nicht unter ihrem Slug. Seiten mit seo.no_index bleiben draußen.
import type { SitemapUrlInput } from '#sitemap/types'

type PageRow = { id: number; slug: string | null; date_updated: string | null; seo: { no_index: boolean | null } | null }

const FETCH_TIMEOUT_MS = 5000

export default defineSitemapEventHandler(async (event) => {
  const directusUrl = useRuntimeConfig(event).public.directusUrl as string | undefined
  if (!directusUrl) return []

  try {
    const [pagesRes, generalRes] = await Promise.all([
      $fetch<{ data: PageRow[] }>(`${directusUrl}/items/pages`, {
        query: { fields: 'id,slug,date_updated,seo.no_index', filter: { status: { _eq: 'published' } }, limit: -1 },
        timeout: FETCH_TIMEOUT_MS,
      }),
      $fetch<{ data: { homepage: number | null } }>(`${directusUrl}/items/general`, {
        query: { fields: 'homepage' },
        timeout: FETCH_TIMEOUT_MS,
      }),
    ])
    const homepageId = generalRes?.data?.homepage ?? null
    return (pagesRes?.data ?? [])
      .filter((p) => p.seo?.no_index !== true && (p.id === homepageId || p.slug))
      .map((p): SitemapUrlInput => ({
        loc: p.id === homepageId ? '/' : `/${p.slug}`,
        ...(p.date_updated ? { lastmod: p.date_updated } : {}),
      }))
  } catch (err: unknown) {
    console.warn('Sitemap: Seiten konnten nicht aus Directus geladen werden:', err instanceof Error ? err.message : err)
    return []
  }
})
