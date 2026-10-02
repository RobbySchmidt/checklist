// shared/utils/share.ts
// Teilen-Links einer Stelle. Jede Quelle trägt ?src=, damit die Bewerbung weiß, woher sie kam.
import { jobPath } from './jobs.ts'

export function shareLinks(i: { siteUrl: string; slug: string; title: string; employerName: string }) {
  const base = (i.siteUrl || '').replace(/\/+$/, '')
  const url = `${base}${jobPath(i.slug)}`
  const whatsappText = `${i.employerName} sucht: ${i.title}. Bewerbung in einer Minute vom Handy: ${url}?src=wa`
  return {
    url,
    qrTargetUrl: `${url}?src=qr`,
    qrImagePath: `/api/qr/${i.slug}`,
    whatsappText,
    whatsappHref: `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
  }
}
