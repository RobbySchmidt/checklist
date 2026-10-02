// app/utils/schema/buildFaqEntity.ts
import type { JsonLdEntity } from './types'
import { useSchemaIds } from '~/composables/schema/useSchemaIds'

export interface FaqInput {
  path: string
  siteUrl: string
  items: Array<{ question?: string | null; answer?: string | null }>
}

export function buildFaqEntity(input: FaqInput): JsonLdEntity | null {
  const ids = useSchemaIds(input.siteUrl)
  const items = input.items.filter((i) => i.question && i.answer)
  if (!items.length) return null

  return {
    '@type': 'FAQPage',
    '@id': `${ids.pageUrl(input.path)}#faq`,
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  }
}
