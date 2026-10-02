// app/utils/schema/buildBreadcrumbEntity.ts
import type { JsonLdEntity } from './types'
import { useSchemaIds } from '~/composables/schema/useSchemaIds'

export interface BreadcrumbInput {
  path: string
  siteUrl: string
  crumbs: Array<{ name: string; url?: string }>
}

export function buildBreadcrumbEntity(input: BreadcrumbInput): JsonLdEntity {
  const ids = useSchemaIds(input.siteUrl)
  const base = input.siteUrl.replace(/\/+$/, '')

  return {
    '@type': 'BreadcrumbList',
    '@id': ids.breadcrumbId(input.path),
    itemListElement: input.crumbs.map((c, idx) => {
      const item: JsonLdEntity = {
        '@type': 'ListItem',
        position: idx + 1,
        name: c.name,
      }
      if (c.url) {
        item.item = c.url === '/' ? `${base}/` : `${base}${c.url}`
      }
      return item
    }),
  }
}
