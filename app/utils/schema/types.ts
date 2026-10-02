// app/utils/schema/types.ts

export type JsonLdEntity = Record<string, any>

export interface ParsedAddress {
  streetAddress?: string
  postalCode?: string
  addressLocality?: string
}

export interface SocialProfile {
  platform: string
  url: string
}
