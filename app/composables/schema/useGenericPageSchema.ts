// app/composables/schema/useGenericPageSchema.ts
import { buildWebPageEntity } from '~/utils/schema/buildWebPageEntity'
import { buildBreadcrumbEntity } from '~/utils/schema/buildBreadcrumbEntity'

interface PageLike {
  title?: string | null
  slug?: string | null
  seo?: {
    title?: string | null
    meta_description?: string | null
    og_image?: string | null
  } | null
}

export function useGenericPageSchema(page: Ref<PageLike | null | undefined> | PageLike | null | undefined) {
  const route = useRoute()
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl as string
  const siteName = config.public.siteName as string
  const assetBaseUrl = `${config.public.directusUrl}/assets`
  const registry = useSchemaRegistry()

  watchEffect(() => {
    const path = route.path
    const p = (isRef(page) ? page.value : page) ?? null
    const name = p?.seo?.title || p?.title || siteName
    const description = p?.seo?.meta_description || undefined
    const imageUrl = p?.seo?.og_image ? `${assetBaseUrl}/${p.seo.og_image}` : undefined

    // Build breadcrumb crumbs from path segments
    const crumbs: Array<{ name: string; url?: string }> = [{ name: 'Startseite', url: '/' }]
    if (path !== '/') {
      const segments = path.replace(/^\/+|\/+$/g, '').split('/')
      let acc = ''
      segments.forEach((seg, idx) => {
        acc += `/${seg}`
        const isLast = idx === segments.length - 1
        const label = isLast ? (p?.title || decodeURIComponent(seg)) : prettify(seg)
        crumbs.push({ name: label, url: isLast ? undefined : acc })
      })
    }

    registry.add(buildWebPageEntity({
      path,
      siteUrl,
      name,
      description,
      imageUrl,
    }))
    registry.add(buildBreadcrumbEntity({
      path,
      siteUrl,
      crumbs,
    }))
  })
}

function prettify(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())
}
