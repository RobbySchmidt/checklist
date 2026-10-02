export interface ReminderCandidate { id: string; status: string; date_created: string; reminder_sent_at: string | null; employer: { id: string; notify_reminders?: boolean | null } }
const DAY_MS = 24 * 60 * 60 * 1000
export function selectReminderCandidates<T extends ReminderCandidate>(list: T[], now: Date): T[] {
  return list.filter((a) => a.status === 'neu' && !a.reminder_sent_at && a.employer?.notify_reminders !== false && now.getTime() - new Date(a.date_created).getTime() >= DAY_MS)
}
export function groupByEmployer<T extends ReminderCandidate>(list: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const a of list) { const k = a.employer.id; if (!m.has(k)) m.set(k, []); m.get(k)!.push(a) }
  return m
}
