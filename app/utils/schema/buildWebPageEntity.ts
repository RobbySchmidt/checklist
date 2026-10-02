// app/utils/schema/buildWebPageEntity.ts
import type { JsonLdEntity } from './types'
import { useSchemaIds } from '~/composables/schema/useSchemaIds'

export interface WebPageInput {
  path: string
  siteUrl: string
  name: string
  description?: string | null
  imageUrl?: string | null
  mainEntityId?: string | null
}

export function buildWebPageEntity(input: WebPageInput): JsonLdEntity {
  const ids = useSchemaIds(input.siteUrl)
  const url = ids.pageUrl(input.path)

  const entity: JsonLdEntity = {
    '@type': 'WebPage',
    '@id': ids.webPageId(input.path),
    url,
    name: input.name,
    isPartOf: { '@id': ids.websiteId },
    breadcrumb: { '@id': ids.breadcrumbId(input.path) },
  }
  if (input.description) entity.description = input.description
  if (input.imageUrl) entity.image = input.imageUrl
  if (input.mainEntityId) entity.mainEntity = { '@id': input.mainEntityId }
  return entity
}
