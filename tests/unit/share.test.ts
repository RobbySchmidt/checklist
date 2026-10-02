// tests/unit/share.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shareLinks } from '../../shared/utils/share.ts'

test('baut Links mit Quelle und WhatsApp-Text', () => {
  const s = shareLinks({ siteUrl: 'https://jobs.example/', slug: 'pflegefachkraft', title: 'Pflegefachkraft (m/w/d)', employerName: 'Sonnenhof' })
  assert.equal(s.url, 'https://jobs.example/jobs/pflegefachkraft')
  assert.equal(s.qrTargetUrl, 'https://jobs.example/jobs/pflegefachkraft?src=qr')
  assert.equal(s.qrImagePath, '/api/qr/pflegefachkraft')
  assert.equal(s.whatsappText, 'Sonnenhof sucht: Pflegefachkraft (m/w/d). Bewerbung in einer Minute vom Handy: https://jobs.example/jobs/pflegefachkraft?src=wa')
  assert.equal(s.whatsappHref, `https://wa.me/?text=${encodeURIComponent(s.whatsappText)}`)
})
