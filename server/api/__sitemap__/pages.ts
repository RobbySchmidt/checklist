import { C } from '#shared/utils/collections'
// Sitemap-Quelle für @nuxtjs/sitemap: die Stellenliste und alle sichtbaren Stellen des Dienstes dieser Domain.
// Keine CMS-Seiten mehr: Das Produkt liest keine pages/general-Collections (geteilte Directus-Instanz).
import type { SitemapUrlInput } from '#sitemap/types'
import { toIsoDate } from '#shared/utils/jobs'

export default defineSitemapEventHandler(async (event) => {
  const employer = event.context.employer
  if (!employer) return []
  try {
    const rows = await appItems<{ slug: string; date_updated: string | null }>(C.jobs, {
      fields: 'slug,date_updated',
      filter: { status: { _eq: 'published' }, valid_through: { _gte: toIsoDate(new Date()) }, employer: { _eq: employer.id } },
    })
    const jobs = rows.map((j): SitemapUrlInput => ({ loc: `/jobs/${j.slug}`, ...(j.date_updated ? { lastmod: j.date_updated } : {}) }))
    return [{ loc: '/jobs' }, ...jobs]
  } catch (err: unknown) {
    console.warn('Sitemap: Stellen konnten nicht geladen werden:', err instanceof Error ? err.message : err)
    return []
  }
})
