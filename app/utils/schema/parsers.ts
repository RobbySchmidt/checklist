// app/utils/schema/parsers.ts
// Adresse aus dem Rich-Text-Feld general.address ("Straße<br>PLZ Ort") für die PostalAddress der Organization.
import type { ParsedAddress } from './types'
import { decodeEntities } from '../sanitizeHtml'

function stripTags(s: string): string {
  return s.replace(/<\/?[a-z][^>]*>/gi, '')
}

export function parseAddressHtml(html: string | null | undefined): ParsedAddress {
  if (!html) return {}

  // Nur den ersten <p>-Block nehmen – Zusätze dahinter (Hinweise etc.) ignorieren
  const firstP = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? html

  const withBreaks = firstP.replace(/<br\s*\/?>/gi, '\n')
  const decoded = decodeEntities(stripTags(withBreaks))
  const lines = decoded.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean)

  if (lines.length === 0) return {}
  const streetAddress = lines[0]

  if (lines.length < 2) return { streetAddress }

  const match = lines[1]?.match(/^(\d{4,5})\s+(.+)$/)
  if (!match) return { streetAddress }

  return {
    streetAddress,
    postalCode: match[1],
    addressLocality: match[2]?.trim(),
  }
}
