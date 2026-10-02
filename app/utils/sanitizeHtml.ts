import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML coming from a WYSIWYG editor (Directus). Allows standard
 * inline + block tags + class/style attrs that the editor typically emits.
 * Returns an empty string for nullish input so it can be used inline in
 * v-html without breaking v-if patterns.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') return ''
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel'],
  })
}

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  ndash: '–', mdash: '—', hellip: '…', shy: '­',
  laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', sbquo: '‚', bdquo: '„',
  copy: '©', reg: '®', trade: '™',
  euro: '€', pound: '£', yen: '¥', cent: '¢',
  sect: '§', para: '¶', middot: '·', bull: '•', deg: '°',
  plusmn: '±', times: '×', divide: '÷',
  szlig: 'ß', auml: 'ä', ouml: 'ö', uuml: 'ü',
  Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü',
}

/** Decode numeric + common named HTML entities (used by utils/schema/parsers.ts). */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITIES[name] ?? match)
}
