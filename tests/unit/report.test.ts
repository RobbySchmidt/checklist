import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aggregateReport, previousMonthRange } from '../../shared/utils/report.ts'

test('previousMonthRange am 1. Oktober liefert September', () => {
  assert.deepEqual(previousMonthRange(new Date(2026, 9, 1, 6)), { monthStart: '2026-09-01', monthEnd: '2026-09-30', label: 'September 2026' })
  assert.deepEqual(previousMonthRange(new Date(2026, 0, 1, 6)), { monthStart: '2025-12-01', monthEnd: '2025-12-31', label: 'Dezember 2025' })
})
test('aggregiert nur den Monat, Median über erreichte Bewerbungen, null ohne Daten', () => {
  const r = aggregateReport({
    monthStart: '2026-09-01', monthEnd: '2026-09-30',
    views: [{ day: '2026-09-10', source: 'google', count: 7 }, { day: '2026-09-11', source: 'wa', count: 3 }, { day: '2026-10-01', source: 'google', count: 99 }],
    applications: [
      { date_created: '2026-09-05T10:00:00Z', first_contact_at: '2026-09-05T12:00:00Z', job: { id: 'j1', title: 'PFK' } },
      { date_created: '2026-09-06T10:00:00Z', first_contact_at: '2026-09-06T16:00:00Z', job: { id: 'j1', title: 'PFK' } },
      { date_created: '2026-09-07T10:00:00Z', first_contact_at: null, job: { id: 'j2', title: 'PHK' } },
      { date_created: '2026-08-30T10:00:00Z', first_contact_at: null, job: { id: 'j2', title: 'PHK' } },
    ],
    jobs: [{ status: 'published', valid_through: '2026-12-01' }, { status: 'expired', valid_through: '2026-09-15' }],
  })
  assert.deepEqual(r.viewsBySource, { google: 7, wa: 3 })
  assert.deepEqual(r.applicationsByJob, [{ title: 'PFK', count: 2 }, { title: 'PHK', count: 1 }])
  assert.equal(r.medianHoursToContact, 4)
  assert.deepEqual(r.total, { views: 10, applications: 3 })
  assert.equal(r.jobsActive, 1); assert.equal(r.jobsExpired, 1)
  const leer = aggregateReport({ monthStart: '2026-09-01', monthEnd: '2026-09-30', views: [], applications: [], jobs: [] })
  assert.equal(leer.medianHoursToContact, null)
  assert.deepEqual(leer.total, { views: 0, applications: 0 })
})
