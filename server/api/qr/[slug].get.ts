// server/api/qr/[slug].get.ts
// QR-Code als SVG für eine Stellenseite, Ziel mit ?src=qr. Keine Prüfung der Stelle nötig: der Code zeigt nur auf eine URL.
import QRCode from 'qrcode'
import { shareLinks } from '#shared/utils/share'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) throw createError({ statusCode: 400, statusMessage: 'Ungültiger Slug' })
  const { public: pub } = useRuntimeConfig(event)
  const { qrTargetUrl } = shareLinks({ siteUrl: pub.siteUrl as string, slug, title: '', employerName: '' })
  const svg = await QRCode.toString(qrTargetUrl, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
  setHeader(event, 'content-type', 'image/svg+xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=86400')
  return svg
})
