// tests/unit/jobPostingCheck.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkJobPosting } from '../../shared/utils/jobPostingCheck.ts'

const full = {
  '@type': 'JobPosting', title: 'Pflegefachkraft', description: '<p>x</p>', datePosted: '2026-10-01', validThrough: '2026-11-30',
  hiringOrganization: { '@type': 'Organization', name: 'Sonnenhof', logo: 'https://x/logo' },
  jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', streetAddress: 'A 1', postalCode: '04277', addressLocality: 'Leipzig', addressCountry: 'DE' } },
  baseSalary: { '@type': 'MonetaryAmount' }, employmentType: ['FULL_TIME'], identifier: { '@type': 'PropertyValue', value: 'j1' }, directApply: true,
}

test('vollständiges Posting: ok, alle Pflicht- und Empfehlungsfelder grün', () => {
  const r = checkJobPosting(full)
  assert.equal(r.ok, true)
  assert.equal(r.required.every((i) => i.ok), true)
  assert.equal(r.recommended.every((i) => i.ok), true)
  assert.equal(r.required.length, 8)
  assert.equal(r.recommended.length, 5)
})

test('fehlende Straße macht ok=false und markiert nur dieses Pflichtfeld', () => {
  const r = checkJobPosting({ ...full, jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', postalCode: '04277', addressLocality: 'Leipzig', addressCountry: 'DE' } } })
  assert.equal(r.ok, false)
  assert.deepEqual(r.required.filter((i) => !i.ok).map((i) => i.key), ['jobLocation.address.streetAddress'])
})

test('fehlende Empfehlung lässt ok=true', () => {
  const { baseSalary, ...ohneGehalt } = full
  const r = checkJobPosting(ohneGehalt)
  assert.equal(r.ok, true)
  assert.deepEqual(r.recommended.filter((i) => !i.ok).map((i) => i.key), ['baseSalary'])
})

test('leere Strings und leere Arrays zählen als fehlend', () => {
  const r = checkJobPosting({ ...full, title: '   ', employmentType: [] })
  assert.equal(r.required.find((i) => i.key === 'title')?.ok, false)
  assert.equal(r.recommended.find((i) => i.key === 'employmentType')?.ok, false)
})
