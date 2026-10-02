// app/utils/schema/buildBrandEntities.ts
import type { JsonLdEntity, SocialProfile } from './types'
import { parseAddressHtml } from './parsers'
import { useSchemaIds } from '~/composables/schema/useSchemaIds'

export interface BuildBrandInput {
  general: {
    logo?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    social_profiles?: SocialProfile[] | null
  }
  siteUrl: string
  siteName: string
  assetBaseUrl: string
}

export function buildBrandEntities(input: BuildBrandInput): JsonLdEntity[] {
  const ids = useSchemaIds(input.siteUrl)
  const addr = parseAddressHtml(input.general.address)
  const siteUrl = input.siteUrl.replace(/\/+$/, '')
  const assetBase = input.assetBaseUrl.replace(/\/+$/, '')

  const hasAddress = !!(addr.streetAddress || addr.postalCode || addr.addressLocality)

  const org: JsonLdEntity = {
    '@type': 'Organization',
    '@id': ids.orgId,
    name: input.siteName,
    url: siteUrl,
    logo: input.general.logo ? `${assetBase}/${input.general.logo}` : undefined,
    telephone: input.general.phone ?? undefined,
    email: input.general.email ?? undefined,
    address: hasAddress ? {
      '@type': 'PostalAddress',
      streetAddress: addr.streetAddress,
      postalCode: addr.postalCode,
      addressLocality: addr.addressLocality,
      addressCountry: 'DE',
    } : undefined,
    sameAs: input.general.social_profiles?.length
      ? input.general.social_profiles.map(p => p.url).filter(Boolean)
      : undefined,
  }

  const website: JsonLdEntity = {
    '@type': 'WebSite',
    '@id': ids.websiteId,
    url: siteUrl,
    name: input.siteName,
    publisher: { '@id': ids.orgId },
  }

  return [org, website]
}
