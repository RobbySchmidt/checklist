const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse/i
export function isBot(userAgent: string | undefined): boolean {
  if (!userAgent) return true
  return BOT_RE.test(userAgent)
}
export const TRACK_SOURCES = ['google', 'wa', 'qr', 'direct'] as const
export type TrackSource = typeof TRACK_SOURCES[number]
export function trackSource(raw: unknown): TrackSource {
  return (TRACK_SOURCES as readonly string[]).includes(String(raw)) ? (raw as TrackSource) : 'direct'
}
