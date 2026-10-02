// tests/unit/buildJobPosting.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildJobPosting } from '../../shared/utils/buildJobPosting.ts'

const employer = {
  id: 'e1', status: 'published', name: 'Pflegedienst Sonnenhof', slug: 'sonnenhof', legal_name: 'Sonnenhof Pflege GmbH', website: 'https://sonnenhof.example',
  address_street: 'Bornaische Straße 12', address_zip: '04277', address_city: 'Leipzig', apply_email: 'demo@example.com',
} as any
const job = {
  id: 'j1', status: 'published', employer, title: 'Pflegefachkraft (m/w/d)', slug: 'pflegefachkraft', employment_types: ['FULL_TIME', 'PART_TIME'],
  intro: 'Wir suchen dich.', tasks: '<ul><li>Grundpflege</li></ul>', requirements: '<p>Examen</p>',
  salary_min: 3400, salary_max: 3900, salary_unit: 'MONTH', date_posted: '2026-10-01', valid_through: '2026-11-30',
} as any

test('baut ein vollständiges JobPosting', () => {
  const e = buildJobPosting({ job, employer, siteUrl: 'https://jobs.example', logoUrl: 'https://cms.example/assets/logo' })
  assert.equal(e['@type'], 'JobPosting')
  assert.equal(e['@id'], 'https://jobs.example/jobs/pflegefachkraft#jobposting')
  assert.equal(e.url, 'https://jobs.example/jobs/pflegefachkraft')
  assert.equal(e.title, 'Pflegefachkraft (m/w/d)')
  assert.equal(e.datePosted, '2026-10-01')
  assert.equal(e.validThrough, '2026-11-30')
  assert.deepEqual(e.employmentType, ['FULL_TIME', 'PART_TIME'])
  assert.equal(e.directApply, true)
  assert.deepEqual(e.hiringOrganization, { '@type': 'Organization', name: 'Sonnenhof Pflege GmbH', sameAs: 'https://sonnenhof.example', logo: 'https://cms.example/assets/logo' })
  assert.deepEqual(e.jobLocation, { '@type': 'Place', address: { '@type': 'PostalAddress', streetAddress: 'Bornaische Straße 12', postalCode: '04277', addressLocality: 'Leipzig', addressCountry: 'DE' } })
  assert.deepEqual(e.baseSalary, { '@type': 'MonetaryAmount', currency: 'EUR', value: { '@type': 'QuantitativeValue', minValue: 3400, maxValue: 3900, unitText: 'MONTH' } })
  assert.deepEqual(e.identifier, { '@type': 'PropertyValue', name: 'Pflegedienst Sonnenhof', value: 'j1' })
  assert.match(e.description, /Wir suchen dich\./)
  assert.match(e.description, /Grundpflege/)
})

test('ohne Gehalt kein baseSalary, nur Mindestwert ohne maxValue', () => {
  const ohne = buildJobPosting({ job: { ...job, salary_min: null, salary_max: 3900 }, employer, siteUrl: 'https://jobs.example' })
  assert.equal('baseSalary' in ohne, false)
  const nurMin = buildJobPosting({ job: { ...job, salary_max: null }, employer, siteUrl: 'https://jobs.example' })
  assert.deepEqual(nurMin.baseSalary.value, { '@type': 'QuantitativeValue', minValue: 3400, unitText: 'MONTH' })
})

test('ohne legal_name und Logo: name = Dienstname, kein logo-Feld', () => {
  const e = buildJobPosting({ job, employer: { ...employer, legal_name: null, website: null }, siteUrl: 'https://jobs.example' })
  assert.deepEqual(e.hiringOrganization, { '@type': 'Organization', name: 'Pflegedienst Sonnenhof' })
})

test('leere employment_types fallen weg, siteUrl ohne doppelten Slash', () => {
  const e = buildJobPosting({ job: { ...job, employment_types: [] }, employer, siteUrl: 'https://jobs.example/' })
  assert.equal('employmentType' in e, false)
  assert.equal(e.url, 'https://jobs.example/jobs/pflegefachkraft')
})
