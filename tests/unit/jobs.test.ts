// tests/unit/jobs.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isJobVisible, jobLocation, salaryText, jobBenefits, toIsoDate, jobPath } from '../../shared/utils/jobs.ts'

const employer = {
  id: 'e1', status: 'published', name: 'Sonnenhof', slug: 'sonnenhof', address_street: 'Bornaische Straße 12', address_zip: '04277', address_city: 'Leipzig',
  apply_email: 'demo@example.com', benefits: [{ label: 'Wunschdienstplan' }], is_demo: true,
} as any

test('toIsoDate liefert lokales Datum als YYYY-MM-DD', () => {
  assert.equal(toIsoDate(new Date(2026, 9, 2, 23, 59)), '2026-10-02')
})

test('Stelle ist sichtbar, wenn published und valid_through heute oder später', () => {
  const now = new Date(2026, 9, 2, 12)
  assert.equal(isJobVisible({ status: 'published', valid_through: '2026-10-02' }, now), true)
  assert.equal(isJobVisible({ status: 'published', valid_through: '2026-10-01' }, now), false)
  assert.equal(isJobVisible({ status: 'draft', valid_through: '2026-12-31' }, now), false)
  assert.equal(isJobVisible({ status: 'filled', valid_through: '2026-12-31' }, now), false)
  assert.equal(isJobVisible({ status: 'published', valid_through: null }, now), false)
})

test('jobLocation nimmt Override nur komplett, sonst Adresse des Dienstes', () => {
  assert.deepEqual(jobLocation({ location_override: null }, employer), { street: 'Bornaische Straße 12', zip: '04277', city: 'Leipzig' })
  assert.deepEqual(jobLocation({ location_override: { street: 'Hauptstr. 1', zip: '04416', city: 'Markkleeberg' } }, employer), { street: 'Hauptstr. 1', zip: '04416', city: 'Markkleeberg' })
  assert.deepEqual(jobLocation({ location_override: { city: 'Markkleeberg' } }, employer), { street: 'Bornaische Straße 12', zip: '04277', city: 'Leipzig' })
})

test('salaryText formatiert Spanne, Einzelwert und nichts', () => {
  assert.equal(salaryText({ salary_min: 3400, salary_max: 3900, salary_unit: 'MONTH' }), '3.400 – 3.900 € pro Monat')
  assert.equal(salaryText({ salary_min: 19.5, salary_max: null, salary_unit: 'HOUR' }), 'ab 19,50 € pro Stunde')
  assert.equal(salaryText({ salary_min: null, salary_max: 3900, salary_unit: 'MONTH' }), null)
})

test('jobBenefits bevorzugt Override, sonst Dienst, nie leer-undefined', () => {
  assert.deepEqual(jobBenefits({ benefits_override: null }, employer), [{ label: 'Wunschdienstplan' }])
  assert.deepEqual(jobBenefits({ benefits_override: [{ label: 'Dienstwagen' }] }, employer), [{ label: 'Dienstwagen' }])
  assert.deepEqual(jobBenefits({ benefits_override: [] }, employer), [{ label: 'Wunschdienstplan' }])
  assert.deepEqual(jobBenefits({ benefits_override: null }, { ...employer, benefits: null }), [])
})

test('jobPath', () => {
  assert.equal(jobPath('pflegefachkraft'), '/jobs/pflegefachkraft')
})
