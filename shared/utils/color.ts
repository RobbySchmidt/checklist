// Farb-Hilfen: Hex-Normalisierung und WCAG-Kontrast.
const HEX = /^#[0-9a-f]{6}$/

export function normalizeHex(input: string): string {
  const v = input.trim().toLowerCase()
  if (!v) return ''
  return v.startsWith('#') ? v : `#${v}`
}

export function isHex(v: string): boolean {
  return HEX.test(v)
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!
}

export function contrastRatio(hexA: string, hexB: string): number {
  const a = luminance(hexA)
  const b = luminance(hexB)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Schriftfarbe mit ausreichendem Kontrast auf einer Fläche: weiß auf dunklen, Tiefgrün auf hellen Farben. */
export function readableText(bgHex: string, light = '#ffffff', dark = '#13392d'): string {
  if (!isHex(bgHex)) return dark
  return contrastRatio(light, bgHex) >= contrastRatio(dark, bgHex) ? light : dark
}

/** CSS-Variablen für das Portal in den Farben eines Dienstes; ungültige oder fehlende Werte fallen auf die Standardfarben zurück. */
export function portalTheme(primary?: string | null, secondary?: string | null): Record<string, string> {
  const ink = primary && isHex(primary) ? primary : '#13392d'
  const mint = secondary && isHex(secondary) ? secondary : '#4ac297'
  return {
    '--portal-ink': ink,
    '--portal-white': readableText(ink),
    '--portal-mint': mint,
    '--portal-mint-fg': readableText(mint),
  }
}
