// tests/unit/applicationSchema.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applicationSchema, normalizePhone } from '../../shared/utils/applicationSchema.ts'

const ok = { job: '2b7c1f6e-1e7a-4c0f-9f0e-0a1b2c3d4e5f', name: 'Anna Beispiel', phone: '0151 123 45 67', qualification: 'pflegefachkraft', hours_wish: 'teilzeit_30', consent: true }

test('gültige Minimalbewerbung geht durch, Defaults gesetzt', () => {
  const r = applicationSchema.safeParse(ok)
  assert.equal(r.success, true)
  if (r.success) {
    assert.equal(r.data.source, 'direct')
    assert.equal(r.data.message, '')
    assert.equal(r.data.earliest_start, '')
  }
})

test('Telefon in Alltagsschreibweisen', () => {
  for (const phone of ['0151 123 45 67', '+49 151 1234567', '0151/1234567', '0341-123456']) {
    assert.equal(applicationSchema.safeParse({ ...ok, phone }).success, true, phone)
  }
  for (const phone of ['abc', '12', '']) {
    assert.equal(applicationSchema.safeParse({ ...ok, phone }).success, false, phone)
  }
})

test('normalizePhone behält Plus und Ziffern', () => {
  assert.equal(normalizePhone('+49 151 / 123-45 67'), '+491511234567')
  assert.equal(normalizePhone('0151 1234567'), '01511234567')
})

test('Einwilligung muss true sein, Qualifikation aus der Liste, job eine UUID', () => {
  assert.equal(applicationSchema.safeParse({ ...ok, consent: false }).success, false)
  assert.equal(applicationSchema.safeParse({ ...ok, qualification: 'arzt' }).success, false)
  assert.equal(applicationSchema.safeParse({ ...ok, job: '123' }).success, false)
})

test('unbekannte Quelle fällt auf direct zurück, Nachricht max 2000 Zeichen', () => {
  const r = applicationSchema.safeParse({ ...ok, source: 'facebook' })
  assert.equal(r.success, true)
  if (r.success) assert.equal(r.data.source, 'direct')
  assert.equal(applicationSchema.safeParse({ ...ok, message: 'x'.repeat(2001) }).success, false)
})
