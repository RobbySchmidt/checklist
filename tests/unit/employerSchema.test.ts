import { test } from 'node:test'
import assert from 'node:assert/strict'
import { employerSchema } from '../../shared/utils/employerSchema.ts'
const ok = { name: 'Sonnenhof', address_street: 'A 1', address_zip: '04277', address_city: 'Leipzig', apply_email: 'demo@example.com' }
test('Minimalprofil gültig, Defaults gesetzt', () => {
  const r = employerSchema.safeParse(ok)
  assert.equal(r.success, true)
  if (r.success) { assert.deepEqual(r.data.benefits, []); assert.equal(r.data.notify_reminders, true) }
})
test('Farben, PLZ, WhatsApp, Website werden geprüft', () => {
  assert.equal(employerSchema.safeParse({ ...ok, color_primary: 'grün' }).success, false)
  assert.equal(employerSchema.safeParse({ ...ok, color_primary: '#1d6b57' }).success, true)
  assert.equal(employerSchema.safeParse({ ...ok, address_zip: '12' }).success, false)
  assert.equal(employerSchema.safeParse({ ...ok, apply_whatsapp: '+49 151' }).success, false)
  assert.equal(employerSchema.safeParse({ ...ok, apply_whatsapp: '491511234567' }).success, true)
  assert.equal(employerSchema.safeParse({ ...ok, website: 'sonnenhof' }).success, false)
  assert.equal(employerSchema.safeParse({ ...ok, benefits: [{ label: '' }] }).success, false)
})
