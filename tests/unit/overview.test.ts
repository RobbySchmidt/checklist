import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aggregateOverview } from '../../shared/utils/overview.ts'

test('zählt nur den laufenden Monat, wartende = status neu, offene Stellen = published und gültig', () => {
  const r = aggregateOverview({
    monthStart: '2026-10-01',
    views: [{ day: '2026-10-02', count: 5 }, { day: '2026-09-30', count: 9 }],
    applications: [
      { status: 'neu', date_created: '2026-10-02T10:00:00Z' },
      { status: 'kontaktiert', date_created: '2026-10-01T10:00:00Z' },
      { status: 'neu', date_created: '2026-09-29T10:00:00Z' },
    ],
    jobs: [{ status: 'published', valid_through: '2026-12-01' }, { status: 'published', valid_through: '2026-09-01' }, { status: 'filled', valid_through: '2026-12-01' }],
    today: '2026-10-02',
  })
  assert.deepEqual(r, { views: 5, applications: 2, waiting: 2, openJobs: 1 })
})
