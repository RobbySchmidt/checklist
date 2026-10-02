import { test } from 'node:test'
import assert from 'node:assert/strict'
import { selectReminderCandidates, groupByEmployer } from '../../shared/utils/reminders.ts'
const now = new Date('2026-10-02T12:00:00Z')
const e = { id: 'e1', notify_reminders: true }
const mk = (p: any) => ({ id: 'x', status: 'neu', date_created: '2026-10-01T11:00:00Z', reminder_sent_at: null, employer: e, ...p })
test('genau 24 h zählt, 23:59 nicht; nur neu; nicht doppelt; Dienst mit Erinnerungen aus wird übersprungen', () => {
  assert.equal(selectReminderCandidates([mk({ date_created: '2026-10-01T12:00:00Z' })], now).length, 1)
  assert.equal(selectReminderCandidates([mk({ date_created: '2026-10-01T12:01:00Z' })], now).length, 0)
  assert.equal(selectReminderCandidates([mk({ status: 'kontaktiert' })], now).length, 0)
  assert.equal(selectReminderCandidates([mk({ reminder_sent_at: '2026-10-02T10:00:00Z' })], now).length, 0)
  assert.equal(selectReminderCandidates([mk({ employer: { id: 'e2', notify_reminders: false } })], now).length, 0)
  assert.equal(selectReminderCandidates([mk({ employer: { id: 'e3', notify_reminders: null } })], now).length, 1)
})
test('groupByEmployer', () => {
  const g = groupByEmployer([mk({ id: 'a' }), mk({ id: 'b', employer: { id: 'e2', notify_reminders: true } }), mk({ id: 'c' })])
  assert.deepEqual([...g.keys()], ['e1', 'e2'])
  assert.equal(g.get('e1')!.length, 2)
})
