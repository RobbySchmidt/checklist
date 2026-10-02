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
  name: string; phone: string; email?: string; qualification: string; hoursWish: string; earliestStart: string; message: string; source: string
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
    `Name: ${i.name}`, `Telefon: ${i.phone}`, i.email ? `E-Mail: ${i.email}` : '', `Qualifikation: ${q}`, `Wunschstunden: ${h}`,
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
${i.email ? `<tr><td style="padding:6px 12px 6px 0;font-weight:600">E-Mail</td><td><a href="mailto:${esc(i.email)}">${esc(i.email)}</a></td></tr>` : ''}
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

export function renderLoginMail(i: { name: string; link: string; minutes: number }) {
  const subject = 'Ihr Anmeldelink für das Portal'
  const text = `Hallo ${i.name},\n\nhier ist Ihr Anmeldelink. Er gilt ${i.minutes} Minuten und nur einmal:\n${i.link}\n\nFalls Sie das nicht angefordert haben, ignorieren Sie diese Mail.`
  const html = `<!doctype html><html lang="de"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#15221d;padding:24px"><p>Hallo ${esc(i.name)},</p><p>hier ist Ihr Anmeldelink. Er gilt ${i.minutes} Minuten und nur einmal.</p><p><a href="${esc(i.link)}" style="display:inline-block;background:#1d6b57;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Jetzt anmelden</a></p><p style="color:#5a6b64;font-size:14px">Falls Sie das nicht angefordert haben, ignorieren Sie diese Mail.</p></body></html>`
  return { subject, text, html }
}

export async function notifyApplication(to: string, bcc: string, mail: ReturnType<typeof renderApplicationMail>): Promise<{ sent: boolean; previewId?: string }> {
  return sendMail(to, bcc, mail)
}

export async function sendMail(to: string, bcc: string, mail: { subject: string; text: string; html: string }): Promise<{ sent: boolean; previewId?: string }> {
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

const SHELL_OPEN = '<!doctype html><html lang="de"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#15221d;padding:24px">'
const BUTTON = 'display:inline-block;background:#1d6b57;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700'

export function renderReminderMail(i: { employerName: string; items: Array<{ name: string; phone: string; jobTitle: string; hours: number }>; portalUrl: string }) {
  const n = i.items.length
  const noun = n === 1 ? 'Bewerbung wartet' : 'Bewerbungen warten'
  const subject = `Erinnerung: ${n} ${noun} auf Rückruf`
  const text = [
    `${i.employerName}: ${n} ${noun} seit über 24 Stunden auf Rückruf.`, '',
    ...i.items.map((a) => `- ${a.name}, ${a.phone}${a.jobTitle ? ` (${a.jobTitle})` : ''}, seit ${a.hours} Stunden`), '',
    `Im Portal ansehen: ${i.portalUrl}`,
  ].join('\n')
  const html = `${SHELL_OPEN}
<h1 style="font-size:20px">${n} ${noun} auf Rückruf</h1>
<p style="color:#5a6b64">${esc(i.employerName)} · seit über 24 Stunden ohne Rückruf</p>
<ul>${i.items.map((a) => `<li><strong>${esc(a.name)}</strong> · <a href="tel:${esc(a.phone)}">${esc(a.phone)}</a>${a.jobTitle ? ` · ${esc(a.jobTitle)}` : ''} · seit ${a.hours} Std.</li>`).join('')}</ul>
<p style="margin-top:24px"><a href="${esc(i.portalUrl)}" style="${BUTTON}">Im Portal ansehen</a></p>
</body></html>`
  return { subject, text, html }
}

export interface ReportMailData {
  viewsBySource: Record<string, number>
  applicationsByJob: Array<{ title: string; count: number }>
  medianHoursToContact: number | null
  jobsActive: number; jobsExpired: number
  total: { views: number; applications: number }
}

export function renderReportMail(i: { employerName: string; label: string; report: ReportMailData; portalUrl: string }) {
  const r = i.report
  const subject = `Ihr Bewerbungsreport ${i.label}`
  const median = r.medianHoursToContact === null ? 'noch keine Rückrufe erfasst' : `${String(r.medianHoursToContact).replace('.', ',')} Stunden`
  const sources = Object.entries(r.viewsBySource)
  const text = [
    `Bewerbungsreport ${i.label} – ${i.employerName}`, '',
    `Aufrufe gesamt: ${r.total.views}`,
    ...sources.map(([s, c]) => `  ${SOURCE_LABELS[s] ?? s}: ${c}`), '',
    `Bewerbungen gesamt: ${r.total.applications}`,
    ...r.applicationsByJob.map((j) => `  ${j.title}: ${j.count}`), '',
    `Median bis zum Rückruf: ${median}`,
    `Stellen: ${r.jobsActive} aktiv, ${r.jobsExpired} abgelaufen`, '',
    `Zum Portal: ${i.portalUrl}`,
  ].join('\n')
  const td = 'padding:4px 16px 4px 0'
  const rows = (list: Array<[string, number]>, empty: string) => list.length ? list.map(([k, v]) => `<tr><td style="${td}">${esc(k)}</td><td>${v}</td></tr>`).join('') : `<tr><td style="${td}">${empty}</td><td></td></tr>`
  const html = `${SHELL_OPEN}
<h1 style="font-size:20px">Ihr Bewerbungsreport ${esc(i.label)}</h1>
<p style="color:#5a6b64">${esc(i.employerName)}</p>
<h2 style="font-size:16px">Aufrufe nach Quelle (${r.total.views})</h2>
<table style="border-collapse:collapse"><tbody>${rows(sources.map(([s, c]) => [SOURCE_LABELS[s] ?? s, c]), 'keine Aufrufe')}</tbody></table>
<h2 style="font-size:16px">Bewerbungen nach Stelle (${r.total.applications})</h2>
<table style="border-collapse:collapse"><tbody>${rows(r.applicationsByJob.map((j) => [j.title, j.count]), 'keine Bewerbungen')}</tbody></table>
<h2 style="font-size:16px">Zeit bis zum Rückruf</h2>
<p>Median: ${esc(median)}</p>
<h2 style="font-size:16px">Stellen</h2>
<p>${r.jobsActive} aktiv, ${r.jobsExpired} abgelaufen</p>
<p style="margin-top:24px"><a href="${esc(i.portalUrl)}" style="${BUTTON}">Zum Portal</a></p>
</body></html>`
  return { subject, text, html }
}
