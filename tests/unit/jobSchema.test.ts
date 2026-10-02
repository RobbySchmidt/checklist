import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jobSchema, slugify, linesToList, listToLines } from '../../shared/utils/jobSchema.ts'

const ok = { title: 'Pflegefachkraft (m/w/d)', slug: 'pflegefachkraft', status: 'published', employment_types: ['FULL_TIME'], date_posted: '2026-10-01', valid_through: '2026-12-01', salary_unit: 'MONTH' }

test('slugify', () => {
  assert.equal(slugify('Pflegefachkraft (m/w/d) – Nachtdienst'), 'pflegefachkraft-m-w-d-nachtdienst')
  assert.equal(slugify('Ärztliche Leitung Süd'), 'aerztliche-leitung-sued')
})
test('gültige Stelle, Defaults für optionale Felder', () => {
  const r = jobSchema.safeParse(ok)
  assert.equal(r.success, true)
  if (r.success) { assert.equal(r.data.intro, ''); assert.equal(r.data.location_override, null) }
})
test('Stunden und Gehalt: min ≤ max, valid_through ≥ date_posted, Override nur komplett', () => {
  assert.equal(jobSchema.safeParse({ ...ok, hours_min: 30, hours_max: 20 }).success, false)
  assert.equal(jobSchema.safeParse({ ...ok, salary_min: 4000, salary_max: 3000 }).success, false)
  assert.equal(jobSchema.safeParse({ ...ok, valid_through: '2026-09-01' }).success, false)
  assert.equal(jobSchema.safeParse({ ...ok, location_override: { city: 'Leipzig' } }).success, false)
  assert.equal(jobSchema.safeParse({ ...ok, location_override: { street: 'A 1', zip: '04277', city: 'Leipzig' } }).success, true)
  assert.equal(jobSchema.safeParse({ ...ok, employment_types: [] }).success, false)
})
test('linesToList erzeugt Liste und escaped HTML', () => {
  assert.equal(linesToList('a\nb'), '<ul><li>a</li><li>b</li></ul>')
  assert.equal(linesToList('  a \n\n<b>&'), '<ul><li>a</li><li>&lt;b&gt;&amp;</li></ul>')
  assert.equal(linesToList(''), '')
})
test('listToLines wandelt zurück', () => {
  assert.equal(listToLines('<ul><li>a</li><li>b</li></ul>'), 'a\nb')
  assert.equal(listToLines(linesToList('x < y\nz & w')), 'x < y\nz & w')
  assert.equal(listToLines(''), '')
})
