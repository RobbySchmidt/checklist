// tests/unit/notify.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderApplicationMail } from '../../server/utils/notify.ts'

test('Mail enthält die vier Angaben, Quelle und Link zur Stelle', () => {
  const m = renderApplicationMail({
    employerName: 'Sonnenhof', jobTitle: 'Pflegefachkraft (m/w/d)', jobUrl: 'https://jobs.example/jobs/pflegefachkraft',
    name: 'Anna Beispiel', phone: '+491511234567', qualification: 'pflegefachkraft', hoursWish: 'teilzeit_30', earliestStart: 'ab Januar', message: '', source: 'wa',
    createdAt: new Date(2026, 9, 2, 14, 30),
  })
  assert.equal(m.subject, 'Neue Bewerbung: Pflegefachkraft (m/w/d) – Anna Beispiel')
  assert.match(m.text, /Anna Beispiel/)
  assert.match(m.text, /\+491511234567/)
  assert.match(m.text, /Pflegefachkraft\b/)
  assert.match(m.text, /Teilzeit, ca\. 30 Stunden/)
  assert.match(m.text, /WhatsApp/)
  assert.match(m.text, /https:\/\/jobs\.example\/jobs\/pflegefachkraft/)
  assert.match(m.html, /href="tel:\+491511234567"/)
})
