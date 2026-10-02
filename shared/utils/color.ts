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
