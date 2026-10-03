// Small rules about inbox items shared by the Inbox, Today and the command palette.
import { addDays, todayIn } from '@/lib/dates'

export const KINDS = ['task', 'note', 'idea', 'link', 'reminder'] as const
export type Kind = (typeof KINDS)[number]

export const KIND_LABELS: Record<string, string> = {
  task: 'Task',
  note: 'Note',
  idea: 'Idea',
  link: 'Link',
  reminder: 'Reminder',
}

export const PRIORITY_LABELS = ['No priority', 'Low', 'Medium', 'High']

const OPEN = ['inbox', 'organized', 'in_progress']

export function isOpen(item: { status: string }): boolean {
  return OPEN.includes(item.status)
}

/** A capture that is only a web address is kept as a link. */
export function looksLikeUrl(text: string): boolean {
  return /^(https?:\/\/|www\.)\S+$/i.test(text.trim()) || /^[\w-]+(\.[\w-]+)+\/\S*$/.test(text.trim())
}

/** "now", "5m", "2h", "Yesterday", a weekday within the week, then a date. */
export function relativeTime(iso: string, timeZone: string, now: Date = new Date()): string {
  const then = new Date(iso)
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`

  const today = todayIn(timeZone, now)
  const day = todayIn(timeZone, then)
  if (day === today) return `${Math.floor(minutes / 60)}h`
  if (day === addDays(today, -1)) return 'Yesterday'
  if (day > addDays(today, -7)) return then.toLocaleDateString('en-US', { weekday: 'short', timeZone })
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone })
}

/** How a due date reads on a chip, and whether it needs attention. */
export function dueLabel(
  dueDate: string,
  today: string
): { label: string; state?: 'soon' | 'overdue' } {
  if (dueDate < today) return { label: 'Overdue', state: 'overdue' }
  if (dueDate === today) return { label: 'Due today', state: 'soon' }
  if (dueDate === addDays(today, 1)) return { label: 'Due tomorrow', state: 'soon' }
  const date = new Date(`${dueDate}T00:00:00Z`)
  if (dueDate <= addDays(today, 6)) {
    return { label: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }) }
  }
  return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) }
}

/** How many open items each filter tab holds. */
export function countByKind(items: Array<{ item_type: string; status: string }>): Record<string, number> {
  const counts: Record<string, number> = { all: 0 }
  for (const item of items) {
    if (!isOpen(item)) continue
    counts.all += 1
    counts[item.item_type] = (counts[item.item_type] ?? 0) + 1
  }
  return counts
}
