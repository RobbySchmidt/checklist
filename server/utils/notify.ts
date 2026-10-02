// server/utils/notify.ts
// Benachrichtigung des Dienstes über eine neue Bewerbung. Mit SMTP (NUXT_MAIL_*) per Nodemailer,
// sonst Log + HTML-Datei unter .data/mail-preview/<id>.html (Vorschau unter /__mail/<id> im Dev-Modus).
import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import nodemailer from 'nodemailer'
import { QUALIFICATION_LABELS, HOURS_WISH_LABELS } from '../../shared/utils/jobs.ts'

const SOURCE_LABELS: Record<string, string> = { google: 'Google', wa: 'WhatsApp', qr: 'QR-Aushang', direct: 'Direkt', demo: 'Demo' }

export interface ApplicationMailInput {
  employerName: string; jobTitle: string; jobUrl: string
  name: string; phone: string; qualification: string; hoursWish: string; earliestStart: string; message: string; source: string
  createdAt: Date
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

export function renderApplicationMail(i: ApplicationMailInput) {
  const q = (QUALIFICATION_LABELS as Record<string, string>)[i.qualification] ?? i.qualification
  const h = (HOURS_WISH_LABELS as Record<string, string>)[i.hoursWish] ?? i.hoursWish
  const src = SOURCE_LABELS[i.source] ?? i.source
  const when = i.createdAt.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
  const subject = `Neue Bewerbung: ${i.jobTitle} – ${i.name}`
  const lines = [
    `Neue Bewerbung für ${i.jobTitle} (${i.employerName})`, '',
    `Name: ${i.name}`, `Telefon: ${i.phone}`, `Qualifikation: ${q}`, `Wunschstunden: ${h}`,
    i.earliestStart ? `Frühester Start: ${i.earliestStart}` : '', i.message ? `Nachricht: ${i.message}` : '', '',
    `Quelle: ${src}`, `Eingegangen: ${when}`, `Stelle: ${i.jobUrl}`, '',
    'Bitte innerhalb von 24 Stunden zurückrufen.',
  ].filter((l) => l !== '')
  const text = lines.join('\n')
  const html = `<!doctype html><html lang="de"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#15221d;padding:24px">
<h1 style="font-size:20px">Neue Bewerbung: ${esc(i.jobTitle)}</h1>
<p style="color:#5a6b64">${esc(i.employerName)} · eingegangen ${esc(when)} · Quelle: ${esc(src)}</p>
<table style="border-collapse:collapse"><tbody>
<tr><td style="padding:6px 12px 6px 0;font-weight:600">Name</td><td>${esc(i.name)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;font-weight:600">Telefon</td><td><a href="tel:${esc(i.phone)}">${esc(i.phone)}</a></td></tr>
<tr><td style="padding:6px 12px 6px 0;font-weight:600">Qualifikation</td><td>${esc(q)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;font-weight:600">Wunschstunden</td><td>${esc(h)}</td></tr>
${i.earliestStart ? `<tr><td style="padding:6px 12px 6px 0;font-weight:600">Frühester Start</td><td>${esc(i.earliestStart)}</td></tr>` : ''}
${i.message ? `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top">Nachricht</td><td>${esc(i.message)}</td></tr>` : ''}
</tbody></table>
<p style="margin-top:24px"><a href="tel:${esc(i.phone)}" style="display:inline-block;background:#1d6b57;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Jetzt zurückrufen</a></p>
<p style="color:#5a6b64;font-size:14px">Stelle: <a href="${esc(i.jobUrl)}">${esc(i.jobUrl)}</a><br>Bitte innerhalb von 24 Stunden zurückrufen.</p>
</body></html>`
  return { subject, text, html }
}

export async function notifyApplication(to: string, bcc: string, mail: ReturnType<typeof renderApplicationMail>): Promise<{ sent: boolean; previewId?: string }> {
  const { mail: cfg } = useRuntimeConfig()
  if (cfg.host) {
    const transport = nodemailer.createTransport({
      host: cfg.host, port: Number(cfg.port), secure: String(cfg.secure) === 'true',
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    })
    await transport.sendMail({ from: cfg.from || cfg.user, to, bcc: bcc || undefined, ...mail })
    return { sent: true }
  }
  const previewId = randomUUID()
  await mkdir('.data/mail-preview', { recursive: true })
  await writeFile(`.data/mail-preview/${previewId}.html`, mail.html, 'utf8')
  console.log(`[notify] Kein SMTP konfiguriert. Mail an ${to}:\n${mail.text}\nVorschau: /__mail/${previewId}`)
  return { sent: false, previewId }
}
